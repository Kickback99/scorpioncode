<template>
  <!-- ===== 弹窗 ===== -->
  <v-dialog v-model="visible" :max-width="dialogMaxWidth" @update:model-value="handleClose">
    <v-card
      :class="[`md-${mdTheme}`, themeStore.isDark ? 'md-dark' : 'md-light']"
      :style="{ '--dialog-scale': scale, '--heading-scale': headingScale }"
    >
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center justify-space-between">
        {{ title }}
        <v-btn icon="mdi-close" variant="text" class="app-icon-btn-lg" @click="handleClose" />
      </v-card-title>

      <!-- 内容：Markdown 渲染 -->
      <v-card-text class="terms-content">
        <!-- 骨架屏：Markdown 加载中 -->
        <div v-if="!markdownReady" class="terms-skeleton">
          <v-skeleton-loader type="heading" class="terms-skeleton-title" />
          <v-skeleton-loader
            v-for="n in skeletonLineGroups"
            :key="n"
            type="sentences"
            class="terms-skeleton-lines"
          />
        </div>

        <!-- 真实内容：Markdown 渲染 -->
        <div v-else class="detail-panel">
          <component
            :is="MarkdownPreviewComponent"
            :text="content"
            :key="configStore.article_detail?.theme"
            :class="themeStore.isDark ? 'user-dark' : 'user-light'"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, shallowRef } from 'vue'
import { useThemeStore } from '@/store/theme'
import { useConfigStore } from '@/store/config'
import { useDisplay } from 'vuetify'
import { useDialogFontScale } from '@/composables/useDialogFontScale'
import { createMarkdownPreview } from '@/utils/markdown-config'

// ============================================================
// 数据
// ============================================================
const display = useDisplay()
const scale = useDialogFontScale()
// 移动端 h2 = 1.5rem × 2/3 = 16px（桌面 24px，正文 14px 见样式区）
const headingScale = useDialogFontScale(2 / 3)
const visible = ref(false)
const configStore = useConfigStore()
const themeStore = useThemeStore()
// 当前 markdown 主题：标题与关闭图标的颜色要跟着它走（vuepress 与 github 的正文色不同）
const mdTheme = computed(() => configStore.getArticleTheme())

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

// ============================================================
// 渲染
// ============================================================
// 响应式 max-width
const dialogMaxWidth = computed(() => display.mobile.value ? '92%' : 600)

// 骨架屏：Markdown 是否加载完成
const markdownReady = ref(false)
// 骨架屏内容行组数：移动端 2 组，PC 3 组
const skeletonLineGroups = computed(() => (display.mobile.value ? 2 : 3))
// 骨架屏额外停留时长候选（秒）：条款/协议为本地常量、加载较快，
// 内容就绪后随机取一个元素作为停留时长，让骨架屏展示时长略有变化、不显呆板
const SKELETON_DELAY_SECONDS = [1, 1.5, 2]

// Markdown 预览组件（手动预加载，加载完成后才渲染正文，避免弹窗内空白闪烁）
const MarkdownPreviewComponent = shallowRef(null)

const loadMarkdown = async (force = false) => {
  markdownReady.value = false
  try {
    // 组件已加载则复用，否则（或主题切换强制刷新）重新创建
    if (!MarkdownPreviewComponent.value || force) {
      MarkdownPreviewComponent.value = await createMarkdownPreview(configStore.getArticleTheme())
    }
    // 内容就绪后随机停留一段时间再展示正文
    const seconds = SKELETON_DELAY_SECONDS[Math.floor(Math.random() * SKELETON_DELAY_SECONDS.length)]
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  } catch (e) {
    console.error('Markdown 加载失败', e)
    MarkdownPreviewComponent.value = null
  } finally {
    markdownReady.value = true
  }
}

// 配置的编辑器主题变化（github↔vuepress）时强制重新加载 Markdown
watch(() => configStore.getArticleTheme(), () => {
  if (visible.value) loadMarkdown(true)
})

// v-model 双向同步
watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => {
  emit('update:modelValue', val)
  // 打开弹窗时预加载 Markdown，加载期间展示骨架屏
  if (val) loadMarkdown()
})

// ============================================================
// 事件处理
// ============================================================
const handleClose = () => { visible.value = false }
</script>

<style scoped lang="scss">
// ============================================================
// 内容区限高滚动
// ============================================================
.terms-content {
  max-height: 60vh;
  // 与 max-height 同值：加载中（骨架）与加载后（内容）容器同高，
  // 避免骨架屏切换为真实内容时因高度不一致导致上下跳动
  min-height: 60vh;
  overflow-y: auto;
}

// ============================================================
// 骨架屏：内容行宽度控制（对齐真实 markdown 内容布局）
// 每组 sentences 渲染 2 行 text 骨，宽度与详情页同一套：
//   第1行（上）→ 70%
//   第2行（下）→ 50%（Vuetify 默认，不再覆盖）
// ============================================================
.terms-skeleton :deep(.v-skeleton-loader__text:first-child) {
  max-width: 70%;
}
/* 骨高取正文字号 16px（骨代表字形墨迹、不代表行盒），与详情页同一套；
   骨距 = (行高 30.4 − 16) / 2 = 7.2px，节距与真实正文逐行对齐 */
.terms-skeleton :deep(.v-skeleton-loader__text) {
  height: 16px;
  margin: 7.2px 0;
}

// ============================================================
// 骨架屏：标题骨（真实内容首行是 h2，之前只有内容骨、缺这一根）
// ============================================================
/* 高 38px = 真实 h2 行盒（30px 行高 + 8px 下边框/内边距）；下间距 8.8 = h2 下外边距 16 − 内容骨上边距 7.2 */
.terms-skeleton-title {
  margin-bottom: 8.8px;
}
.terms-skeleton-title :deep(.v-skeleton-loader__heading) {
  margin: 0;
  height: 38px;
}
/* 移动端（< 960px，同 display.mobile）：h2 16px → 标题骨 25.6 / 间距 9.7，正文 14px → 内容骨 14 / 骨距 6.3 */
@media (max-width: 959.98px) {
  .terms-skeleton-title {
    margin-bottom: 9.7px;
  }
  .terms-skeleton-title :deep(.v-skeleton-loader__heading) {
    height: 25.6px;
  }
  .terms-skeleton :deep(.v-skeleton-loader__text) {
    height: 14px;
    margin: 6.3px 0;
  }
}

// ============================================================
// vuepress 主题：深色背景
// ============================================================
:deep(.v-md-editor-preview.user-dark .vuepress-markdown-body) {
  background: var(--v-theme-surface);
  color: #fff;
}

// ============================================================
// vuepress 主题：浅色背景
// ============================================================
:deep(.v-md-editor-preview.user-light .vuepress-markdown-body) {
  background: var(--v-theme-surface);
  color: #000;
}

.detail-panel {
  :deep(.github-markdown-body),
  :deep(.vuepress-markdown-body) {
    padding: 0 !important;
  }
}

// ============================================================
// 移动端字号缩放
// ============================================================
.v-card {
  --dialog-scale: 1;
  --heading-scale: 1;

  /* 弹窗标题对齐详情页 h1：桌面 28px / xs 24px + 字重 600。
     Vuetify 的 .v-card-title 默认 500，比正文 h2 的 600 还轻，层次是倒挂的 */
  :deep(.v-card-title) {
    font-size: 28px !important;
    font-weight: 600 !important;

    @media (max-width: 599.98px) {
      font-size: 24px !important;
    }
  }

  /* 标题与关闭图标色跟随 md 主题的正文色：vuepress 把正文写成纯黑/纯白，
     留在 on-surface 0.87 会比正文浅；github 下两者本就同色，无需覆盖 */
  &.md-vuepress :deep(.v-card-title, .v-card-title .v-btn) {
    color: #000 !important;
  }
  &.md-vuepress.md-dark :deep(.v-card-title, .v-card-title .v-btn) {
    color: #fff !important;
  }

  :deep(.detail-panel) {
    font-size: calc(1rem * var(--dialog-scale));
  }

  // 移动端 h2 收到 16px（桌面 24px），比正文大一档
  :deep(.detail-panel h2) {
    font-size: calc(1.5rem * var(--heading-scale)) !important;
  }
}

/* 移动端正文 14px（桌面 16px）：主题给 .github-markdown-body 写死 16px、--dialog-scale 压不动，只能按元素盖；
   不整层盖是为了不连 h2 一起打成 14px（h2 那条规则特异性更低） */
@media (max-width: 959.98px) {
  .detail-panel :deep(.github-markdown-body),
  .detail-panel :deep(.vuepress-markdown-body) {
    p, li, blockquote, td, th {
      font-size: 14px !important;
    }
  }
}
</style>
