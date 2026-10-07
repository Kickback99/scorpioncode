<template>
  <!-- ===== 弹窗 ===== -->
  <v-dialog v-model="visible" :max-width="dialogMaxWidth" @update:model-value="handleClose">
    <v-card
      class="notice-dialog-card"
      :class="[`md-${mdTheme}`, themeStore.isDark ? 'md-dark' : 'md-light']"
      :style="{ '--dialog-scale': scale, '--heading-scale': headingScale }"
    >
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="notice-dialog-title">{{ title }}</span>
        <v-btn icon="mdi-close" variant="text" class="app-icon-btn-lg" @click="handleClose" />
      </v-card-title>
      <v-card-subtitle>
        <v-divider color="primary" opacity=".7" gradient><span class="text-caption" style="flex-shrink: 0;">推送于 {{ pushTime || '-' }}</span></v-divider>
      </v-card-subtitle>

      <!-- 内容：Markdown 渲染 -->
      <v-card-text>
        <div class="detail-panel" @click="handleCopyClick">
          <!-- 懒加载期间交给 Suspense 兜底，否则弹窗先空一截、加载完再撑开 -->
          <Suspense>
            <component
              :is="MarkdownPreview"
              :text="content"
              :key="configStore.article_detail?.theme"
              :class="themeStore.isDark ? 'user-dark' : 'user-light'"
            />
            <template #fallback>
              <div class="dialog-loading">
                <v-progress-circular indeterminate color="primary" size="40" />
                <span>加载中...</span>
              </div>
            </template>
          </Suspense>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, defineAsyncComponent } from 'vue'
import { useDisplay } from 'vuetify'
import { useDialogFontScale } from '@/composables/useDialogFontScale'
import { createMarkdownPreview } from '@/utils/markdown-config'
import { useThemeStore } from '@/store/theme'
import { useConfigStore } from '@/store/config'

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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '公告消息' },
  content: { type: String, default: '' },
  pushTime: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

// ============================================================
// 响应式 max-width
// ============================================================
const dialogMaxWidth = computed(() => display.mobile.value ? '85%' : 600)

// 当前 markdown 主题：标题色要跟着它走（vuepress 与 github 的正文色不同）
const mdTheme = computed(() => configStore.getArticleTheme())

// ============================================================
// Markdown 预览组件（跟随主题）
// ============================================================
const MarkdownPreview = computed(() => {
  const currentThem = configStore.getArticleTheme()
  return defineAsyncComponent(() => createMarkdownPreview(currentThem))
})

// ============================================================
// v-model 双向同步
// ============================================================
watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

// ============================================================
// 事件处理
// ============================================================
const handleClose = () => { visible.value = false }

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
</script>

<style scoped lang="scss">
// ============================================================
// 公告图片样式
// ============================================================
:deep(.v-md-editor-preview img){
    display: block !important;
    width: 350px;
    margin: auto !important;
}

.detail-panel {
  :deep(.github-markdown-body),
  :deep(.vuepress-markdown-body) {
    padding: 0 !important;
  }
}

/* 懒加载兜底：撑住高度，否则加载完成时弹窗从 36px 一下弹开 */
.dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: rgba(var(--v-theme-on-surface), 0.6);
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
    // 标题会吃满可用宽度，space-between 无剩余空间可分，得手动留白
    gap: 8px;

    @media (max-width: 599.98px) {
      font-size: 24px !important;
    }
  }

  /* 裸文本节点做 flex 子项时 min-width 是 auto，配 nowrap 无法收缩，长标题会撑破弹窗把 × 挤出去 */
  .notice-dialog-title {
    min-width: 0;
    line-height: 1.4;

    /* Vuetify 的 nowrap 要先改回 normal，下面才截得了两行 */
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .text-caption {
    font-size: calc(0.75rem * var(--dialog-scale)) !important;
  }

  :deep(.detail-panel) {
    font-size: calc(1rem * var(--dialog-scale));
  }

  // 移动端 h2 收到 16px（桌面 24px），比正文大一档
  :deep(.detail-panel h2) {
    font-size: calc(1.5rem * var(--heading-scale)) !important;
  }

  /* 标题色跟随 md 主题的正文色：vuepress 主题把正文写成纯黑/纯白（markdown-preview.scss），
     标题留在 on-surface 0.87 会比正文浅；github 下正文与标题本就同为 0.87，无需覆盖 */
  &.md-vuepress :deep(.v-card-title) {
    color: #000 !important;
  }
  &.md-vuepress.md-dark :deep(.v-card-title) {
    color: #fff !important;
  }
  /* 关闭图标走同一条口径：它读按钮的 color、不跟标题走，vuepress 下会比标题浅一档 */
  &.md-vuepress :deep(.v-card-title .v-btn) {
    color: #000 !important;
  }
  &.md-vuepress.md-dark :deep(.v-card-title .v-btn) {
    color: #fff !important;
  }

  /* 卡片自己滚 + 标题 sticky，subtitle 里的推送时间才能跟正文一起滚走；
     若改成卡片不滚、正文内滚，subtitle 是滚动区的兄弟节点，会被连标题一起钉住 */
  :deep(.v-card-title) {
    position: sticky;
    top: 0;
    /* 要压过正文里的定位元素（代码块 z-index 1、行号到 4），同值会被 DOM 更靠后的它们盖住；
       background 不能省，否则正文从标题底下透出来 */
    z-index: 10;
    background: inherit;
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

<style lang="scss">
// ============================================================
// 背景暗化
// ============================================================
.v-overlay__scrim {
  opacity: 0.6 !important;
}

/* Vuetify 给对话框直系 v-card 开了 overflow:auto，而卡片自己的滚动条不受自己圆角裁剪，
   方角会盖住右侧圆角（左角没滚动条，所以只有右边看着是直的）。由父层补一刀裁剪；
   投影会被父层的 overflow 一并裁掉，故从卡片挪到父层，视觉不变 */
.v-overlay__content:has(> .notice-dialog-card) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 11px 15px -7px rgba(0, 0, 0, .2), 0 24px 38px 3px rgba(0, 0, 0, .14), 0 9px 46px 8px rgba(0, 0, 0, .12);

  > .notice-dialog-card {
    box-shadow: none;
  }
}
</style>
