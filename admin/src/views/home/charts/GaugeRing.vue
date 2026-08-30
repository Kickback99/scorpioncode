<template>
  <div class="gauge-ring" :style="{ '--gauge-color': gaugeColor }">
    <div class="gauge-chart">
      <div ref="chartRef" class="gauge-ec"></div>
      <div class="gauge-center">
        <span class="gauge-value">{{ value }}%</span>
      </div>
    </div>
    <div class="gauge-label">{{ label }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { init } from 'echarts/core'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },
  colorType: { type: String, default: 'info' },
})

const chartRef = ref(null)
let chartInstance = null
let themeObserver = null

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const v = computed(() => Math.min(100, Math.max(0, props.value)))

const buildOption = () => {
  const c = cssVar('--el-color-' + props.colorType)
  const t = cssVar('--el-color-' + props.colorType + '-light-9')
  return {
    series: [{
      type: 'pie',
      radius: ['75%', '95%'],
      center: ['50%', '50%'],
      silent: true,
      itemStyle: { borderWidth: 0 },
      label: { show: false },
      data: [
        { value: v.value, itemStyle: { color: c } },
        { value: 100 - v.value, itemStyle: { color: t } },
      ],
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

onMounted(() => {
  renderChart()
  window.addEventListener('resize', () => chartInstance?.resize())
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance?.resize())
  themeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped lang="scss">
.gauge-ring {
  display: flex; flex-direction: column; align-items: center;
}

.gauge-chart {
  position: relative; width: 120px; height: 120px;
}

.gauge-ec {
  width: 100%; height: 100%;
}

.gauge-center {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: var(--el-bg-color); border-radius: 50%;
  width: 72px; height: 72px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.gauge-value {
  font-size: 18px; font-weight: 700; color: var(--el-text-color-primary);
}

.gauge-label {
  margin-top: 10px; font-size: 13px; font-weight: 600; color: var(--el-text-color-regular);
}
</style>
