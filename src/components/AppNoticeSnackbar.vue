<template>
  <!-- ===== Snackbar ===== -->
  <v-snackbar
    v-model="visible"
    z-index="9999"
    color="info"
    location="bottom right"
    :timeout="-1"
    multi-line
    position="fixed"
    class="notice-snackbar"
    :style="{ '--snackbar-width': snackbarWidth, '--snackbar-scale': scale }"
  >
    <div>
      <!-- 标题栏：标题 + 关闭图标 -->
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-subtitle-1 font-weight-bold text-truncate">{{ title }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="compact"
          size="small"
          color="white"
          @click="handleClose"
        />
      </div>
      <!-- 内容（单行截断） -->
      <div class="text-body-2 text-truncate mb-2">{{ content }}</div>
      <!-- 底部操作按钮 -->
      <div class="d-flex justify-end align-center" style="gap: 8px;">
        <v-btn
          v-if="showDontShowAgain"
          variant="text"
          size="small"
          class="text-caption"
          @click="handleDontShowAgain"
        >
          不再提示
        </v-btn>
        <v-btn
          v-if="showActionBtn"
          color="primary"
          variant="flat"
          size="small"
          @click="handleAction"
        >
          {{ actionBtnText }}
        </v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

// ============================================================
// 数据
// ============================================================
const display = useDisplay()
const scale = useDialogFontScale()
const visible = ref(false)

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '公告消息' },
  content: { type: String, default: '' },
  showDontShowAgain: { type: Boolean, default: true },
  showActionBtn: { type: Boolean, default: true },
  actionBtnText: { type: String, default: '查看详情' },
})

const emit = defineEmits(['update:modelValue', 'action', 'dontShowAgain'])

// ============================================================
// 响应式宽度
// ============================================================
const snackbarWidth = computed(() => display.mobile.value ? '45vw' : '300px')

// ============================================================
// 渲染（v-model 双向同步）
// ============================================================
watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

// ============================================================
// 事件处理
// ============================================================
const handleClose = () => { visible.value = false }

const handleDontShowAgain = () => {
  emit('dontShowAgain')
  visible.value = false
}

const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss">
// ============================================================
// 响应式宽度
// ============================================================
.notice-snackbar .v-snackbar__wrapper,
.notice-snackbar .v-snackbar__content {
  width: var(--snackbar-width);
  min-width: 0 !important;
  max-width: none !important;
}
</style>

<style scoped lang="scss">
// ============================================================
// 移动端字号缩放
// ============================================================
.notice-snackbar {
  --snackbar-scale: 1;

  .text-subtitle-1 {
    font-size: calc(1rem * var(--snackbar-scale)) !important;
  }

  .text-body-2 {
    font-size: calc(0.875rem * var(--snackbar-scale)) !important;
  }

  .text-caption {
    font-size: calc(0.75rem * var(--snackbar-scale)) !important;
  }

  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--snackbar-scale)) !important;
  }
}
</style>
