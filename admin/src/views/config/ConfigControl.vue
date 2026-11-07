<template>
  <!-- ===== 配置控件渲染 ===== -->
  <template v-if="item.type === 'switch'">
    <el-switch size="small" :model-value="item.get()" @change="item.set" />
  </template>
  <template v-else-if="item.type === 'radio'">
    <el-radio-group :model-value="item.get()" @change="item.set" size="small">
      <el-radio v-for="opt in item.options" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
    </el-radio-group>
  </template>
  <template v-else-if="item.type === 'number'">
    <el-input-number
      :model-value="item.get()"
      :min="item.min?.() ?? -Infinity"
      :max="item.max?.() ?? Infinity"
      @change="item.set"
      size="small"
    />
  </template>
</template>

<script setup>
// ============================================================
// 配置控件渲染 — 根据 item.type 渲染 switch / radio / number
// ============================================================

defineProps({
  /** @type {import('@/data/configItems').ConfigItem} */
  item: { type: Object, required: true }
})
</script>
