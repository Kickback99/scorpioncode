<template>
  <!-- ===== Dialog ===== -->
  <v-dialog v-model="visible" :max-width="dialogMaxWidth" @update:model-value="handleClose">
    <v-card :style="{ '--dialog-scale': scale }">
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center justify-space-between">
        {{ title }}
        <v-btn icon="mdi-close" variant="text" density="compact" size="small" @click="handleClose" />
      </v-card-title>
      <v-card-subtitle>
        <v-divider color="primary" opacity=".7" gradient><span class="text-caption text-grey" style="flex-shrink: 0;">推送时间：{{ pushTime || '-' }}</span></v-divider>
      </v-card-subtitle>

      <!-- 内容：Markdown 渲染 -->
      <v-card-text>        
        <div class="detail-panel" @click="handleCopyClick">
          <component
            :is="MarkdownPreview"
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

// ============================================================
// 移动端字号缩放
// ============================================================
.v-card {
  --dialog-scale: 1;

  :deep(.v-card-title) {
    font-size: calc(1rem * var(--dialog-scale)) !important;
  }

  .text-caption {
    font-size: calc(0.75rem * var(--dialog-scale)) !important;
  }

  :deep(.detail-panel) {
    font-size: calc(1rem * var(--dialog-scale));
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
</style>
