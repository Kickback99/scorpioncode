<template>
  <div ref="chartRef" class="chart-box"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { init } from 'echarts/core'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  xData: { type: Array, default: () => [] },
  y1: { type: Array, default: () => [] },
})

const chartRef = ref(null)
let chartInstance = null
let themeObserver = null

const cssVar = (name) => getComputedStyle(document.documentElement)
  .getPropertyValue(name).trim()

const buildOption = () => ({
  color: [cssVar('--el-color-primary')],
  tooltip: { trigger: 'axis', borderWidth: 0, borderRadius: 8, padding: [12], backgroundColor: cssVar('--el-bg-color-overlay') },
  grid: { left: 0, right: 10, bottom: 10, top: 10, containLabel: true },
  xAxis: {
    data: props.xData, type: 'category',
    axisLabel: { color: cssVar('--el-text-color-secondary') },
    axisLine: { lineStyle: { color: cssVar('--el-border-color-lighter') } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value', minInterval: 1,
    axisLabel: { color: cssVar('--el-text-color-secondary') },
    splitLine: { lineStyle: { type: 'dashed', color: cssVar('--el-border-color-lighter') } },
  },
  series: [{ type: 'bar', name: '发布量', data: props.y1, barWidth: '40%' }],
})

// ============================================================
// 渲染
// ============================================================
const renderChart = () => {
  const dom = chartRef.value
  if (!dom) return
  if (!chartInstance) chartInstance = init(dom, { renderer: 'svg' })
  chartInstance.setOption(buildOption(), true)
}

const handleResize = () => chartInstance?.resize()

watch(() => [props.xData, props.y1], renderChart, { deep: true })

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
.chart-box { width: 100%; height: 320px; }
</style>
