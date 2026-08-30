<template>
  <v-dialog
    v-model="visible"
    :max-width="config.maxWidth"
    :persistent="config.persistent"
    :class="config.dialogClass"
    @update:model-value="handleDialogClose"
  >
    <v-card :style="{ '--dialog-scale': scale }">
      <!-- 标题区域 -->
      <v-card-title class="d-flex align-center">
        <v-icon v-if="config.icon" :icon="config.icon" :color="config.iconColor" class="mr-2" />
        {{ config.title }}
      </v-card-title>
      
      <!-- 内容区域：支持纯文本和 Markdown -->
      <v-card-text class="pt-4" :class="config.textClass">
        <!-- 纯文本模式 -->
        <div v-if="!config.useMarkdown" class="long-text-content">
          {{ config.content }}
        </div>
        <!-- Markdown 模式（暂不实现，预留） -->
        <div v-else>
          <!-- 后续支持 Markdown 渲染 -->
          {{ config.content }}
        </div>
      </v-card-text>

      <!-- 按钮区域 -->
      <v-card-actions>
        <v-spacer />
        
        <v-btn
          v-if="config.showCancel"
          :color="config.cancelColor"
          :variant="config.cancelVariant"
          @click="handleCancel"
        >
          {{ config.cancelText }}
        </v-btn>
        
        <v-btn
          :color="config.confirmColor"
          :variant="config.confirmVariant"
          @click="handleConfirm"
        >
          {{ config.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

const visible = ref(false)
const scale = useDialogFontScale()

const config = reactive({
  title: '提示',
  content: '',
  icon: '',
  iconColor: '',
  maxWidth: 400,
  persistent: false,
  dialogClass: '',
  textClass: '',
  showCancel: true,
  cancelText: '取消',
  cancelColor: 'default',
  cancelVariant: 'text',
  confirmText: '确定',
  confirmColor: 'primary',
  confirmVariant: 'flat',
  useMarkdown: false,  // 是否使用 Markdown
  onConfirm: null,
  onCancel: null
})

let confirmCallback = null
let cancelCallback = null

// 显示对话框的方法
const show = (options) => {
  // 重置配置
  Object.assign(config, {
    title: options.title || '提示',
    content: options.content || '',
    icon: options.icon || '',
    iconColor: options.iconColor || '',
    maxWidth: options.maxWidth || 400,
    persistent: options.persistent !== undefined ? options.persistent : false,
    dialogClass: options.dialogClass || '',
    textClass: options.textClass || '',
    showCancel: options.showCancel !== undefined ? options.showCancel : true,
    cancelText: options.cancelText || '取消',
    cancelColor: options.cancelColor || 'default',
    cancelVariant: options.cancelVariant || 'text',
    confirmText: options.confirmText || '确定',
    confirmColor: options.confirmColor || 'primary',
    confirmVariant: options.confirmVariant || 'flat',
    useMarkdown: options.useMarkdown || false
  })
  
  confirmCallback = options.onConfirm || null
  cancelCallback = options.onCancel || null
  
  visible.value = true
}

// alert 方法（只有确认按钮）
const alert = (options) => {
  show({
    showCancel: false,
    confirmText: options.confirmText || '确定',
    ...options
  })
}

// confirm 方法（有取消和确认按钮）
const confirm = (options) => {
  show({
    showCancel: true,
    confirmText: options.confirmText || '确定',
    cancelText: options.cancelText || '取消',
    ...options
  })
}

const handleConfirm = () => {
  visible.value = false
  if (confirmCallback) {
    confirmCallback()
  }
}

const handleCancel = () => {
  visible.value = false
  if (cancelCallback) {
    cancelCallback()
  }
}

const handleDialogClose = (val) => {
  if (!val) {
    // 如果对话框被外部关闭（点击外部），也触发取消回调
    if (cancelCallback) {
      cancelCallback()
    }
    confirmCallback = null
    cancelCallback = null
  }
}

// 暴露方法给全局使用
if (typeof window !== 'undefined') {
  window.$dialog = {
    show,
    alert,
    confirm
  }
}

// 暴露给组件使用
defineExpose({
  show,
  alert,
  confirm
})
</script>

<style scoped lang="scss">
// ============================================================
// 移动端字号缩放
// ============================================================
.v-card {
  --dialog-scale: 1;

  :deep(.v-card-title) {
    font-size: calc(1.25rem * var(--dialog-scale)) !important;
  }

  :deep(.v-card-text) {
    font-size: calc(0.875rem * var(--dialog-scale)) !important;
  }

  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--dialog-scale)) !important;
  }
}
</style>