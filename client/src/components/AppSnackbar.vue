<template>
  <v-snackbar
    v-model="visible"
    z-index="9999"
    :color="config.color"
    :location="config.location"
    :timeout="config.timeout"
    :variant="config.variant"
    :rounded="config.rounded"
    multi-line
    position="fixed"
    :style="{ '--snackbar-scale': scale }"
  >
    <slot>
      <!-- 默认行内布局 -->
      <div class="d-flex align-center" style="gap: 12px;">
        <!-- 图标 -->
        <v-icon v-if="config.icon" :icon="config.icon" :color="config.iconColor" size="24"></v-icon>

        <!-- 内容区域 -->
        <div class="flex-grow-1">
          <div class="text-body-2">
            {{ config.text }}
          </div>
        </div>

        <!-- 关闭按钮 -->
        <v-btn
          v-if="config.showCloseBtn"
          :color="config.btnColor"
          variant="text"
          size="small"
          @click="visible = false"
        >
          {{ config.btnText }}
        </v-btn>
        <!-- 自定义按钮 -->
        <v-btn
          v-if="config.showActionBtn"
          :color="config.actionBtnColor || 'primary'"
          variant="flat"
          size="small"
          @click="handleAction"
        >
          {{ config.actionBtnText }}
        </v-btn>
      </div>
    </slot>
  </v-snackbar>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useDialogFontScale } from '@/composables/useDialogFontScale'

// ============================================================
// 数据
// ============================================================
const visible = ref(false)
const scale = useDialogFontScale()
let actionCallback = null

const config = reactive({
  text: '',
  color: 'success',
  location: 'top center',
  icon: '',
  iconColor: '',
  timeout: 3000,
  variant: 'elevated',
  rounded: 'md',
  showCloseBtn: true,
  btnText: '关闭',
  btnColor: 'on-surface',
  persistent: false,
})

// ============================================================
// 渲染
// ============================================================
const show = (options) => {
  if (typeof options === 'string') {
    config.text = options
    config.color = 'success'
    config.icon = ''
    config.iconColor = ''
    config.persistent = false
    config.timeout = 3000
  } else {
    Object.assign(config, {
      text: options.text || '',
      color: options.color || 'success',
      location: options.location || 'top center',
      icon: options.icon || '',
      iconColor: options.iconColor || '',
      timeout: options.persistent ? -1 : (options.timeout !== undefined ? options.timeout : 3000),
      variant: options.variant || 'elevated',
      rounded: options.rounded || 'md',
      showCloseBtn: options.showCloseBtn !== false,
      btnText: options.btnText || '关闭',
      btnColor: options.btnColor || 'on-surface',
      persistent: options.persistent || false,
      showActionBtn: options.showActionBtn || false,
      actionBtnText: options.actionBtnText || '查看详情',
      actionBtnColor: options.actionBtnColor || 'primary',
    })
    actionCallback = options.onAction || null
  }

  visible.value = true
}

// ============================================================
// 事件处理
// ============================================================
const handleAction = () => {
  if (actionCallback) {
    actionCallback()
  }
}

// 统一参数处理函数
const normalizeParams = (text, title, options) => {
  let finalTitle = ''
  let finalOptions = {}

  if (typeof title === 'string') {
    finalTitle = title
    finalOptions = options || {}
  } else if (typeof title === 'object' && title !== null) {
    finalTitle = ''
    finalOptions = title
  } else {
    finalTitle = ''
    finalOptions = options || {}
  }

  return { title: finalTitle, options: finalOptions }
}

// error 方法
const error = (text, title, options = {}) => {
  const { title: finalTitle, options: finalOptions } = normalizeParams(text, title, options)

  show({
    text,
    title: finalTitle,
    color: 'error',
    icon: finalOptions.icon || 'mdi-alert-circle-outline',
    iconColor: finalOptions.iconColor || '',
    persistent: finalOptions.persistent || false,
    timeout: finalOptions.persistent ? -1 : (finalOptions.timeout || 3000),
    ...finalOptions
  })
}

// success 方法
const success = (text, title, options = {}) => {
  const { title: finalTitle, options: finalOptions } = normalizeParams(text, title, options)

  show({
    text,
    title: finalTitle,
    color: 'success',
    icon: finalOptions.icon || 'mdi-check-circle',
    iconColor: finalOptions.iconColor || '',
    persistent: finalOptions.persistent || false,
    timeout: finalOptions.persistent ? -1 : (finalOptions.timeout || 3000),
    ...finalOptions
  })
}

// warning 方法
const warning = (text, title, options = {}) => {
  const { title: finalTitle, options: finalOptions } = normalizeParams(text, title, options)

  show({
    text,
    title: finalTitle,
    color: 'warning',
    icon: finalOptions.icon || 'mdi-alert',
    iconColor: finalOptions.iconColor || '',
    persistent: finalOptions.persistent || false,
    timeout: finalOptions.persistent ? -1 : (finalOptions.timeout || 3000),
    ...finalOptions
  })
}

// info 方法
const info = (text, title, options = {}) => {
  const { title: finalTitle, options: finalOptions } = normalizeParams(text, title, options)

  show({
    text,
    title: finalTitle,
    color: 'info',
    icon: finalOptions.icon || 'mdi-information',
    iconColor: finalOptions.iconColor || '',
    persistent: finalOptions.persistent || false,
    timeout: finalOptions.persistent ? -1 : (finalOptions.timeout || 3000),
    ...finalOptions
  })
}

// 暴露方法给全局使用
if (typeof window !== 'undefined') {
  window.$snackbar = {
    show,
    error,
    success,
    warning,
    info
  }
}

// 暴露给组件使用
defineExpose({
  show,
  error,
  success,
  warning,
  info
})
</script>

<style scoped lang="scss">
// ============================================================
// 移动端字号缩放
// ============================================================
.v-snackbar {
  --snackbar-scale: 1;

  .text-body-2 {
    font-size: calc(0.875rem * var(--snackbar-scale)) !important;
  }

  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--snackbar-scale)) !important;
  }
}
</style>
