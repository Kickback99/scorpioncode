<template>
  <v-container :class="{ 'detail-xs': xs }">
  <!-- ===== 骨架屏：加载中 ===== -->
  <v-card v-if="isLoading || !markdownReady" variant="flat">
    <v-card-title>
      <v-skeleton-loader type="heading" class="detail-skeleton-title" />
    </v-card-title>

    <div class="detail-skeleton-content">
      <v-skeleton-loader
        v-for="n in skeletonLineGroups"
        :key="n"
        type="sentences"
        class="detail-skeleton-lines"
      />
    </div>
  </v-card>

  <!-- ===== 真实内容 ===== -->
  <v-card v-else variant="flat">
    <v-card-title>
      <h1 class="detail-title-text">{{ article.title }}</h1>
    </v-card-title>

    <v-card-subtitle>
      <v-divider color="primary" opacity=".7" gradient><span class="text-caption" style="flex-shrink: 0;">发布于 {{ article.createTime || '-' }} · 浏览 {{ article.viewCount || 0 }}</span></v-divider>
    </v-card-subtitle>

    <div class="markdown-content" @click="handleCopyClick">
       <component
        v-if="MarkdownPreviewComponent"
        :is="MarkdownPreviewComponent"
        :text="article.content"
        ref="preview"
        :class="themeStore.isDark?'user-dark':'user-light'"
        />
    </div>
  </v-card>

  <!-- ===== 移动端：相关标签 + 相关文章（复用 AppSidebar 逻辑） ===== -->
  <AppMobileRelated v-if="isArticleLoaded && markdownReady" :tags="tags" :articles="cateArticles" />

  <!-- ===== 底部操作栏 ===== -->
  <div v-if="(configStore.getUserLoginEnabled() || isLoggedIn) && isArticleLoaded && markdownReady" class="mt-5 d-flex justify-center py-4">
    <v-btn
      variant="text"
      :color="isFavorite ? 'red' : 'grey'"
      @click="handleFavoriteToggle"
      :loading="favoriteLoading"
      stacked
    >
      <v-icon size="15" class="mb-1">
        {{ isFavorite ? 'mdi-heart-broken' : 'mdi-heart-outline' }}
      </v-icon>
      <div class="d-flex align-center">
        <span>收藏</span>
        <span v-if="configStore.getFavoriteCountEnabled() && article.favoriteCount > 0">
          {{ article.favoriteCount }}
        </span>
      </div>
    </v-btn>
  </div>
  
  <!-- ===== 新增：评论组件 ===== -->
  <div class="mt-5" v-if="isArticleLoaded && markdownReady && (configStore.getUserLoginEnabled() || isLoggedIn) && configStore.getArticleCommentEnabled() && article.isComment === '1'">
    <AppComment
    :articleId="article.id"
    :isComment="article.isComment"
    :totalCount="article.commentCount"
    @comment-deleted="handleCommentCountChange"
    />
  </div>


  <!-- ===== TOC 文章目录 ===== -->
  <AppArticleToc ref="tocRef" :preview="preview" />

  <!-- ===== 回到顶部 ===== -->
  <AppBackToTop ref="backToTopRef" :hasToc="hasToc" />
  </v-container>
</template>

<script setup>
import { articleDetailApi, toggleFavoriteApi, updateViewCountApi } from '@/api/article';
import { onMounted, ref, shallowRef, watch, nextTick, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import emitter from '@/utils/event-bus.js'
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';
import { createMarkdownPreview } from '@/utils/markdown-config';
import { useConfigStore } from '@/store/config';
import AppComment from '@/components/AppComment.vue'
import AppMobileRelated from '@/components/AppMobileRelated.vue'
import AppArticleToc from '@/components/AppArticleToc.vue'
import AppBackToTop from '@/components/AppBackToTop.vue'

// ============================================================
// 数据
// ============================================================
const userStore = useUserStore()

// 判断用户是否已登录（统一走 store getter：cookie 模式看 user 展示缓存，jwt 模式看 token+user）
const isLoggedIn = computed(() => userStore.isLoggedIn)

const preview = ref(null);
const tocRef = ref(null);
const backToTopRef = ref(null);
const hasToc = ref(false);
const route = useRoute();
const router = useRouter();
const props = defineProps(['id']);
const article = ref({ title: '', content: '' });
const cateArticles = ref([]);
const tags = ref([]);
const isFavorite = ref(false);
const favoriteLoading = ref(false);
// 骨架屏：加载状态
const isLoading = ref(true);
// 骨架屏内容行组数：移动端 4 组，PC 6 组
const display = useDisplay();
const skeletonLineGroups = computed(() => (display.mobile.value ? 4 : 6));
// xs（< 600px）：标题缩一档的开关，尺寸见样式区 .detail-xs
const { xs } = useDisplay();
// 文章详情是否真正加载完毕：isLoading=false 且已拿到文章数据（覆盖路由切换中 / 文章不存在等路径）
const isArticleLoaded = computed(() => !isLoading.value && !!article.value.id);
// 正文是否加载完成：手动预加载 Markdown（异步），完成后置 true；
// 骨架屏持续到此时，标题与正文一起出现，相关文章/标签/收藏也随之同步
const markdownReady = ref(false);
// 系统配置
const configStore = useConfigStore()

// 手动预加载 Markdown 组件（异步），完成后存组件并置 markdownReady：
// 不用 defineAsyncComponent，因为那只有在正文组件挂载后才赋 preview，
// 无法在骨架屏阶段提前感知「正文就绪」，也就没法让标题与正文一起出现
const MarkdownPreviewComponent = shallowRef(null);

// ============================================================
// Markdown 加载
// ============================================================
const loadMarkdown = async (force = false) => {
  // 已加载则跳过，避免路由切换时重复加载导致骨架屏闪烁
  if (!force && MarkdownPreviewComponent.value) return;
  markdownReady.value = false;
  try {
    MarkdownPreviewComponent.value = await createMarkdownPreview(configStore.getArticleTheme());
  } catch (e) {
    console.error('Markdown 加载失败', e);
    MarkdownPreviewComponent.value = null;
  } finally {
    markdownReady.value = true;
  }
};

// ============================================================
// 文章详情
// ============================================================
const renderArticleItem = async() => {
  isLoading.value = true
  let res
  try {
    res = await articleDetailApi(props.id);
  } catch (e) {
    // 资源不存在（后端 405，如 detail/1、detail/sssw 无对应文章）：直接跳 404，不弹提示
    // 其余错误（网络超时/断网/服务异常）已由 http.js 拦截器统一提示，回首页兜底
    router.replace(e?.code === 405 ? '/404' : '/')
    return
  } finally {
    isLoading.value = false
  }
  article.value = res.data.articleItem;
  isFavorite.value = res.data.isFavorite || false;
  cateArticles.value = res.data.cateArticles;
  tags.value = res.data.tags;
  emitter.emit('detail-data', {
    cateArticles: cateArticles.value,
    tags: tags.value
  });

  // 更新文章浏览量到redis（article.id 值是对外 url_id，后端解析为真实 id）
  updateViewCountApi(article.value.id).catch(err => console.error('更新浏览量失败', err))

  // 异步预加载正文 Markdown（markdownReady 驱动骨架屏 → 标题与正文一起出现）
  loadMarkdown();

  nextTick(() => {
    tocRef.value?.generateAnchors();
    hasToc.value = tocRef.value?.getHasToc() ?? false;
    backToTopRef.value?.recalculatePosition();
  });
};

// 异步 Markdown 组件挂载完成后重建目录与定位：
// renderArticleItem 里的 nextTick 执行时 Markdown 可能尚未加载完成，preview 仍为 null
watch(preview, (val) => {
  if (!val) return;
  nextTick(() => {
    tocRef.value?.generateAnchors();
    hasToc.value = tocRef.value?.getHasToc() ?? false;
    backToTopRef.value?.recalculatePosition();
  });
});

const updateFavoriteIcon  = async() => {
  const res = await articleDetailApi(props.id);
  isFavorite.value = res.data.isFavorite || false;
};

// 添加处理刷新评论数方法
const handleCommentCountChange = async () => {
  const res = await articleDetailApi(props.id);
  article.value.commentCount = res.data.articleItem.commentCount
}

// 处理收藏切换
const handleFavoriteToggle = async () => {
  // 检查是否登录（统一走 store getter：cookie 模式看 user 展示缓存，jwt 模式看 token+user）
  if (!isLoggedIn.value) {
    // 未登录，直接触发登录弹窗（不弹 snackbar，与「登录后参与评论」入口保持一致）
    emitter.emit('loginDialogVisible', true);
    return;
  }
  
  favoriteLoading.value = true;
  try {
    const res = await toggleFavoriteApi(article.value.id);
    isFavorite.value = res.data.isFavorite;
      // 更新文章收藏数显示
      if (res.data.isFavorite) {
        article.value.favoriteCount = (article.value.favoriteCount || 0) + 1;
      } else {
        article.value.favoriteCount = Math.max(0, (article.value.favoriteCount || 0) - 1);
      }
  } catch (error) {
    // 401（业务码/HTTP）已由 http.js 拦截器统一清理并提示，此处仅记录，不做重复处理
    console.error('收藏操作失败', error);
  } finally {
    favoriteLoading.value = false;
  }
};

// ============================================================
// 代码块复制
// ============================================================
// 只给被点击的代码块按钮加对勾：先清掉其它按钮的 copied，实现排它效果
const handleCopyClick = (e) => {
  const btn = e.target.closest('.v-md-copy-code-btn')
  if (!btn) return

  document.querySelectorAll('.v-md-copy-code-btn.copied').forEach((b) => b.classList.remove('copied'))
  btn.classList.add('copied')

  // 1.5秒后移除
  setTimeout(() => {
    btn.classList.remove('copied')
  }, 1500)
}

// ============================================================
// 主题切换
// ============================================================
const themeStore = useThemeStore()

// 配置的编辑器主题变化（github↔vuepress）时强制重新加载 Markdown
watch(() => configStore.getArticleTheme(), () => {
  if (isArticleLoaded.value) loadMarkdown(true);
});


// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  renderArticleItem();
});

watch(() => route.params.id, (newId) => {
  if (newId) renderArticleItem();
});

// 监听主题切换，重建 TOC 目录
watch(() => themeStore.isDark, () => {
  const scrollY = window.scrollY;
  nextTick(() => {
    setTimeout(() => {
      tocRef.value?.generateAnchors();
      // 恢复滚动位置，避免主题切换导致页面跳动
      window.scrollTo({ top: scrollY });
    }, 100);
  });
});

watch(() => isLoggedIn.value, () => {
  if (isLoggedIn.value) {
    updateFavoriteIcon();
  } else {
    isFavorite.value = false;
  }
}, { immediate: false }); // 页面初始化时不触发，避免重复请求
</script>

<style scoped>
/* ============================================================
   标题
   ============================================================ */
/* 文章标题：用 h1 拿语义（全页唯一主标题，故正文须从 ## 起），字号字重显式定（32px/44px、600），不跟 Vuetify 的 h1 默认值（40px、700）；
 * clamp 限 2 行，须放在无 padding 的内层元素上，否则会被 v-card-title 的 overflow 连底部 padding 一起裁掉。 */
.detail-title-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  font-size: 32px;
  font-weight: 600;
  line-height: 44px;
}

/* ============================================================
   骨架屏
   ============================================================ */
/* 骨架屏：标题骨对齐标题单行行高（桌面 44px / xs 34px），全宽 */
.detail-skeleton-title {
  width: 100%;
}

.detail-skeleton-title :deep(.v-skeleton-loader__heading) {
  margin: 0;
  height: 44px;
}

/* 骨架屏：内容区 padding 对齐真实内容（左16卡片 + 右16卡片+20 markdown） */
.detail-skeleton-content {
  padding: 8px 36px 16px 16px;
}

/* ============================================================
   骨架屏内容行宽度控制区
   ============================================================
   每组 sentences 渲染 2 行 text 骨：
     第1行 :first-child   → 默认 100%，可在此改 max-width
     第2行 :nth-child(2)  → Vuetify 默认 max-width 50%
   修改宽度就在下方规则里调整即可 */
 .detail-skeleton-content :deep(.v-skeleton-loader__text:first-child) {
  max-width: 70%;
}
.detail-skeleton-content :deep(.v-skeleton-loader__text) {
  margin: 4px 0;
}

/* ============================================================
   正文
   ============================================================ */
/* 主内容区域 */
.markdown-content {
  width: 100%;
}

/* 正文 h4：github 主题给 1em（= 正文 16px），与正文同大比不出层级，抬到 18px；
 * vuepress 主题未定义 h4 字号，会落到 Vuetify 默认值，一并覆盖以保证两套主题一致 */
:deep(.github-markdown-body h4),
:deep(.vuepress-markdown-body h4) {
  font-size: 18px;
}

/* 行内代码字号：与正文一致（库默认 85% 偏小，移动端尤甚） */
:deep(.markdown-content code:not(pre code)) {
  font-size: 1em !important;
}

/* ============================================================
   xs（< 600px）：标题缩一档
   ============================================================
   主标题 → 24，正文 h2 → 20，h3 → 18，h4 → 17；正文 h5–h6 本就小于正文 16px，再缩会不可读，保持原样。
   两套主题基准不同（github 用 em、vuepress 用 rem），统一用 px 覆盖，小屏表现才一致。 */
.detail-xs .detail-title-text {
  font-size: 24px;
  line-height: 34px;
}

.detail-xs :deep(.github-markdown-body h2),
.detail-xs :deep(.vuepress-markdown-body h2) {
  font-size: 20px;
}

.detail-xs :deep(.github-markdown-body h3),
.detail-xs :deep(.vuepress-markdown-body h3) {
  font-size: 18px;
}

.detail-xs :deep(.github-markdown-body h4),
.detail-xs :deep(.vuepress-markdown-body h4) {
  font-size: 17px;
}

/* 骨架骨同步到 xs 下的标题单行行高 */
.detail-xs .detail-skeleton-title :deep(.v-skeleton-loader__heading) {
  height: 34px;
}

</style>