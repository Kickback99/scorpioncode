<template>
  <v-container>
  <!-- 骨架屏：加载中 -->
  <v-card v-if="isLoading" variant="flat">
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

  <!-- 真实内容 -->
  <v-card v-else variant="flat">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>{{ article.title }}</span>
    </v-card-title>

    <div class="markdown-content">
       <component
        :is="MarkdownPreview"
        :text="article.content"
        ref="preview"
        @copy-code-success="handleCopySuccess"
        :key="configStore.article_detail?.theme"
        :class="themeStore.isDark?'user-dark':'user-light'"
        />
    </div>
  </v-card>

  <!-- 移动端：相关标签 + 相关文章（复用 AppSidebar 逻辑） -->
  <AppMobileRelated :tags="tags" :articles="cateArticles" />

  <!-- 底部操作栏 -->
  <div v-if="(configStore.getUserLoginEnabled() || isLoggedIn) && article.title" class="mt-5 d-flex justify-center py-4">
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
  
  <!-- 新增：评论组件 -->
  <div class="mt-5" v-if="configStore.getUserLoginEnabled() && configStore.getArticleCommentEnabled() && article.isComment === '1'">
    <AppComment
    :articleId="article.id"
    :isComment="article.isComment"
    :totalCount="article.commentCount"
    @comment-deleted="handleCommentCountChange"
    />
  </div>


  <!-- TOC 文章目录 -->
  <AppArticleToc ref="tocRef" :preview="preview" />
  </v-container>
</template>

<script setup>
import { articleDetailApi, toggleFavoriteApi, updateViewCountApi } from '@/api/article';
import { onMounted, ref, watch, nextTick, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import MarkdownIt from 'markdown-it';
import emitter from '@/utils/event-bus.js'
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';
import { createMarkdownPreview } from '@/utils/markdown-config';
import { useConfigStore } from '@/store/config';
import AppComment from '@/components/AppComment.vue'
import AppMobileRelated from '@/components/AppMobileRelated.vue'
import AppArticleToc from '@/components/AppArticleToc.vue'
const userStore = useUserStore()

// 判断用户是否已登录（统一走 store getter：cookie 模式看 user 展示缓存，jwt 模式看 token+user）
const isLoggedIn = computed(() => userStore.isLoggedIn)

const preview = ref(null);
const tocRef = ref(null);
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
// 系统配置
const configStore = useConfigStore()

const renderArticleItem = async() => {
  isLoading.value = true
  let res
  try {
    res = await articleDetailApi(props.id);
  } catch (e) {
    // 文章不存在（真实 id 被拒绝等）：提示并回首页
    window.$snackbar?.error('文章不存在')
    router.replace('/')
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
  updateViewCountApi(article.value.id).catch(err => window.$snackbar?.error(err))
  
  nextTick(() => {
    tocRef.value?.generateAnchors();
  });
};

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
  // 检查是否登录
  if (!userStore.token) {
    // 未登录，触发登录弹窗
    // 提示信息
    // t_question：不显示提示消息
    window.$snackbar?.error('请登录','')
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
    console.error('收藏操作失败', error);
    if (error.response?.status === 401) {
      emitter.emit('loginDialogVisible', true);
    }
  } finally {
    favoriteLoading.value = false;
  }
};

// ========== 代码块复制业务 ==========
const handleCopySuccess = () => {
  const copyButtons = document.querySelectorAll('.v-md-copy-code-btn')
  
  copyButtons.forEach(btn => {
    // 添加copied类
    btn.classList.add('copied')
    
    // 1.5秒后移除
    setTimeout(() => {
      btn.classList.remove('copied')
    }, 1500)
  })
}

// ========== 主题切换业务 ==========

const themeStore = useThemeStore()

// 使用 computed 每次重新创建组件
const MarkdownPreview = computed(() => {
  console.log('创建主题:', themeStore.isDark?"vuepress":"github")
  const currentThem = configStore.getArticleTheme()
  return createMarkdownPreview(currentThem)
})


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
/* 骨架屏：标题骨 32px 匹配真实标题行高，全宽 */
.detail-skeleton-title {
  width: 100%;
}

.detail-skeleton-title :deep(.v-skeleton-loader__heading) {
  margin: 0;
  height: 32px;
}

/* 骨架屏：内容区 padding 对齐真实内容（左16卡片 + 右16卡片+20 markdown） */
.detail-skeleton-content {
  padding: 8px 36px 16px 16px;
}

/* ============ 骨架屏内容行宽度控制区 ============
 * 每组 sentences 渲染 2 行 text 骨：
 *   第1行 :first-child   → 默认 100%，可在此改 max-width
 *   第2行 :nth-child(2)  → Vuetify 默认 max-width 50%
 * 修改宽度就在下方规则里调整即可
 */
 .detail-skeleton-content :deep(.v-skeleton-loader__text:first-child) {
  max-width: 70%;
}
.detail-skeleton-content :deep(.v-skeleton-loader__text) {
  margin: 4px 0;
}

/* 主内容区域 */
.markdown-content {
  width: 100%;
}

/* vuepress主题：文章详情页深色背景下的颜色 */
:deep(.v-md-editor-preview.user-dark .vuepress-markdown-body){
  background: var(--v-theme-surface);
  color: #fff;
  code:not(pre code) {
    background-color: rgb(var(--v-theme-surface-variant),0.7) !important;
    color: rgb(var(--v-theme-on-primary)) !important;
  }

  tr:nth-child(2n) {
    background: transparent !important;
  }
}

/* vuepress主题：文章详情页浅色背景下的颜色 */
:deep(.v-md-editor-preview.user-light .vuepress-markdown-body){
  background: var(--v-theme-surface);
  color: #000;
  code:not(pre code) {
    background-color: rgb(var(--v-theme-surface-variant),0.5) !important;
    color: rgb(var(--v-theme-on-surface-variant)) !important;
  }

  tr:nth-child(2n) {
    background: transparent !important;
  }
}

/* github主题：文章详情页浅色背景下的颜色 */
:deep(.v-md-editor-preview .github-markdown-body){
  code:not(pre code) {
    background-color: rgb(var(--v-theme-surface-variant),0.7) !important;
    color: rgb(var(--v-theme-primary)) !important;
  }
  tr:nth-child(2n) {
    background: white !important;
  }
}

:deep(.v-md-copy-code-btn){
  background-color: rgb(var(--v-theme-primary),.7) !important;
}

:deep(.v-md-copy-code-btn.copied svg) {
  display: none;
}

:deep(.v-md-copy-code-btn.copied::after) {
  content: "";
  position: absolute;
  left: 50%;
  top: 45%;
  width: 8px;
  height: 14px;
  border-right: 2.5px solid rgb(var(--v-theme-on-primary));
  border-bottom: 2.5px solid rgb(var(--v-theme-on-primary));
  transform: translate(-50%, -50%) rotate(45deg);
  border-radius: 1px;
}

</style>

<style>


</style>