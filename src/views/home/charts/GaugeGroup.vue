<template>
  <el-card shadow="never">
    <template #header><span class="gauge-title">数据概览</span></template>
    <div class="gauge-row">
      <GaugeRing
        v-for="(item, idx) in items"
        :key="item.label"
        :label="item.label"
        :value="item.value"
        :color-type="gaugeColors[idx]"
      />
    </div>
  </el-card>
</template>

<script setup>
import GaugeRing from './GaugeRing.vue'

const gaugeColors = ['primary', 'success', 'danger']

defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped lang="scss">
.gauge-title { font-size: 15px; font-weight: 500; color: var(--el-text-color-primary); }
.gauge-row { display: flex; justify-content: space-around; align-items: flex-start; padding: 12px 0; }
</style>
