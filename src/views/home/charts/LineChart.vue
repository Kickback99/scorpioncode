<template>
  <div class="chart-wrapper">
    <div ref="chartRef" class="chart-box"></div>
    <div v-if="!hasData" class="chart-empty-hint">暂无数据</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { init } from 'echarts/core'
import { createLineChart } from './lineChart'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  xData: { type: Array, default: () => [] },
  y1: { type: Array, default: () => [] },
  y2: { type: Array, default: () => [] },
  y3: { type: Array, default: () => [] },
  hasData: { type: Boolean, default: true },
})

const chartRef = ref(null)
let chartInstance = null
let themeObserver = null

// ============================================================
// 渲染
// ============================================================
const renderChart = () => {
  const dom = chartRef.value
  if (!dom) return
  if (!chartInstance) {
    chartInstance = init(dom, { renderer: 'svg' })
  }
  chartInstance.setOption(createLineChart({
    xData: props.xData,
    y1: props.y1,
    y2: props.y2,
    y3: props.y3,
  }), true)
}

const handleResize = () => chartInstance?.resize()

watch(() => [props.xData, props.y1, props.y2, props.y3], renderChart, { deep: true })

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  themeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped lang="scss">
.chart-wrapper {
  position: relative;
}

.chart-box {
  width: 100%;
  height: 320px;
}

.chart-empty-hint {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px; color: var(--el-text-color-placeholder);
  pointer-events: none;
}
</style>
