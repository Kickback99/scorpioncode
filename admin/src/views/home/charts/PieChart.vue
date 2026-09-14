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
  legendData: { type: Array, default: () => [] },
  seriesData: { type: Array, default: () => [] },
})

const chartRef = ref(null)
let chartInstance = null
let themeObserver = null

const cssVar = (name) => getComputedStyle(document.documentElement)
  .getPropertyValue(name).trim()

const buildOption = () => {
  const isMobile = window.innerWidth < 768
  const isMedium = window.innerWidth < 992

  return {
    color: [
      cssVar('--el-color-chart-0'),
      cssVar('--el-color-chart-1'),
      cssVar('--el-color-chart-2'),
      cssVar('--el-color-chart-3'),
      cssVar('--el-color-chart-4'),
      cssVar('--el-color-chart-5'),
      cssVar('--el-color-chart-6'),
      cssVar('--el-color-chart-7'),
      cssVar('--el-color-chart-8'),
      cssVar('--el-color-chart-9'),
    ],
    tooltip: {
      trigger: 'item',
      borderWidth: 0,
      borderRadius: 8,
      padding: [8, 12],
      backgroundColor: cssVar('--el-bg-color-overlay'),
      textStyle:{
        color: cssVar('--el-text-color-regular'),
      },
      extraCssText: 'font-size:12px;',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      // 移动端图例下移，避免与饼图主体左右拥挤
      orient: isMobile ? 'horizontal' : 'vertical',
      ...(isMobile ? { left: 'center', bottom: 0 } : { right: 10, top: 'center' }),
      textStyle: { color: cssVar('--el-text-color-regular'), fontSize: isMobile ? 11 : 12 },
      formatter: (name) => {
        const item = props.seriesData.find((d) => d.name === name)
        return `${name}  ${item?.value ?? 0}`
      },
    },
    series: [{
      name: '分类统计',
      type: 'pie',
      radius: isMobile ? ['30%', '58%'] : isMedium ? ['28%', '52%'] : ['40%', '70%'],
      center: isMobile ? ['50%', '42%'] : isMedium ? ['28%', '50%'] : ['40%', '50%'],
      avoidLabelOverlap: false,
      padAngle: 2,
      itemStyle: {
        borderRadius: 10,
        borderColor: 'transparent',
        borderWidth: 2,
      },
      label: { show: false },
      data: props.seriesData.map(({ name, value }) => ({ name, value })),
    }],
  }
}

// ============================================================
// 渲染
// ============================================================
const renderChart = () => {
  const dom = chartRef.value
  if (!dom) return
  if (!chartInstance) chartInstance = init(dom, { renderer: 'svg' })
  chartInstance.setOption(buildOption(), true)
}

const handleResize = () => {
  chartInstance?.resize()
  chartInstance?.setOption(buildOption())
}

watch(() => [props.legendData, props.seriesData], renderChart, { deep: true })

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
