<template>
  <div class="area-chart-wrapper">
    <div ref="chartRef" class="area-chart-box"></div>
    <div v-if="!hasData" class="chart-empty-hint">暂无数据</div>
  </div>
</template>

<script setup>
// ============================================================
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { init } from 'echarts/core'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  xData: { type: Array, default: () => [] },
  y1: { type: Array, default: () => [] },
  hasData: { type: Boolean, default: true },
})

const chartRef = ref(null)
let chartInstance = null
let themeObserver = null

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const buildOption = () => ({
  color: [cssVar('--el-color-primary')],
  tooltip: {
    trigger: 'axis',
    borderWidth: 0,
    borderRadius: 10,
    padding: [12, 16],
    backgroundColor: cssVar('--el-bg-color-overlay'),
    formatter: (params) => {
      const p = params[0]
      return `<div style="display:flex;align-items:center;gap:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${cssVar('--el-color-primary')};display:inline-block"></span>
        <b style="font-size:16px;color:${cssVar('--el-text-color-primary')}">${p.value}</b>
        <span style="font-size:13px;color:${cssVar('--el-text-color-regular')}">访问</span>
        </div>
        <div style="font-size:12px;color:${cssVar('--el-text-color-secondary')};margin-top:4px">${p.name}</div>`
    },
  },
  grid: { left: 0, right: 10, bottom: 20, top: 20, containLabel: true },
  xAxis: {
    data: props.xData, type: 'category', boundaryGap: false,
    axisLabel: { color: cssVar('--el-text-color-secondary'), fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value', minInterval: 1, splitNumber: 3,
    axisLabel: { show: false },
    splitLine: { lineStyle: { color: cssVar('--el-border-color-lighter') } },
  },
  series: [{
    type: 'line', data: props.y1, smooth: true, symbol: 'circle', symbolSize: 8,
    lineStyle: { color: cssVar('--el-color-primary'), width: 3, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
    itemStyle: { color: cssVar('--el-color-primary'), borderColor: cssVar('--el-bg-color'), borderWidth: 2 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: cssVar('--el-color-primary-light-3') },
          { offset: 1, color: cssVar('--el-color-primary-light-9') },
        ],
      },
    },
  }],
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
.area-chart-wrapper { position: relative; }
.area-chart-box { width: 100%; height: 190px; }
.chart-empty-hint {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px; color: var(--el-text-color-placeholder);
  pointer-events: none;
}
</style>
