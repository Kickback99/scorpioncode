<template>
  <div class="ui-slider-row">
    <span class="ui-slider-label">{{ label }}</span>
    <el-slider
      :model-value="modelValue"
      @input="$emit('update:modelValue', $event)"
      :min="min"
      :max="max"
      :step="step"
      size="small"
      :format-tooltip="formatTooltip"
    />
  </div>
</template>

<script setup>
defineProps({
  /** 滑块左侧标签文字 */
  label: { type: String, required: true },
  /** 当前值 */
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 5 },
  /** tooltip 格式化函数 */
  formatTooltip: { type: Function, default: undefined },
})

defineEmits(['update:modelValue'])
</script>

<style scoped lang="scss">
.ui-slider-row {
  margin-top: 12px;
}

.ui-slider-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}
</style>
