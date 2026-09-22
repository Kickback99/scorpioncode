<template>
  <!-- ===== Dialog ===== -->
  <v-dialog v-model="visible" :max-width="dialogMaxWidth" @update:model-value="handleClose">
    <v-card :style="{ '--dialog-scale': scale, '--heading-scale': headingScale }">
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center justify-space-between">
        {{ title }}
        <v-btn icon="mdi-close" variant="text" density="compact" size="small" @click="handleClose" />
      </v-card-title>

      <!-- 内容：Markdown 渲染 -->
      <v-card-text class="terms-content">
        <!-- 骨架屏：Markdown 加载中 -->
        <div v-if="!markdownReady" class="terms-skeleton">
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
const headingScale = useDialogFontScale(0.55)
const visible = ref(false)
const configStore = useConfigStore()
const themeStore = useThemeStore()

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
// 骨架屏内容行组数：移动端 4 组，PC 6 组
const skeletonLineGroups = computed(() => (display.mobile.value ? 4 : 6))
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
  // 与 max-height 同值：加载中(骨架)与加载后(内容)容器同高，
  // 避免骨架屏切换为真实内容时因高度不一致导致上下跳动
  min-height: 60vh;
  overflow-y: auto;
}

// ============================================================
// 骨架屏：内容行宽度控制（对齐真实 markdown 内容布局）
// 每组 sentences 渲染 2 行 text 骨：
//   第1行（上）→ 短的 70%
//   第2行（下）→ 长的 100% 全宽
// ============================================================
.terms-skeleton :deep(.v-skeleton-loader__text:first-child) {
  max-width: 70%;
}
.terms-skeleton :deep(.v-skeleton-loader__text + .v-skeleton-loader__text) {
  max-width: 100%;
}
.terms-skeleton :deep(.v-skeleton-loader__text) {
  margin: 4px 0;
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

  :deep(.v-card-title) {
    font-size: calc(1rem * var(--dialog-scale)) !important;
  }

  :deep(.detail-panel) {
    font-size: calc(1rem * var(--dialog-scale));
  }

  // 移动端 h2 标题缩小至 h4 视觉层级
  :deep(.detail-panel h2) {
    font-size: calc(1.5rem * var(--heading-scale)) !important;
  }
}
</style>
