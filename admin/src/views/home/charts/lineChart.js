/**
 * 折线图 option builder — 访问量 / 收藏数 / 评论数 三条线
 * 颜色使用 Element Plus CSS 变量，跟随主题切换
 */

const cssVar = (name) => getComputedStyle(document.documentElement)
  .getPropertyValue(name).trim()

/** 动态取整：数据全 0 → 5000；否则按数量级上浮到美观数值 */
const ceilToNice = (val) => {
  if (val <= 0) return 5000
  const mag = Math.pow(10, Math.floor(Math.log10(val)))
  const nice = [1, 2, 5, 10]
  for (const n of nice) {
    const step = n * mag
    if (val <= step * 5) return step * 5
  }
  return Math.ceil(val / mag) * mag
}

export const createLineChart = (props = {}) => {
  const { xData = [], y1 = [], y2 = [], y3 = [] } = props

  // 动态计算 y 轴上限：取所有系列最大值，上浮 10% 再取整
  const dataMax = Math.max(
    ...y1, ...y2, ...y3,
    0,
  )
  const yMax = ceilToNice(dataMax * 1.1)
  const yInterval = yMax / 5

  return {
    color: [
      cssVar('--el-color-primary'),
      cssVar('--el-color-success'),
      cssVar('--el-color-warning'),
    ],
    tooltip: {
      axisPointer: { type: 'cross' },
      backgroundColor: cssVar('--el-bg-color-overlay'),
      textStyle:{
        color: cssVar('--el-text-color-regular'),
        fontSize: "12px",
        fontWeight: '400'
      },
      borderWidth: 0,
      extraCssText: 'font-size:12px;',
      formatter: '{a}: {c}'
    },
    legend: {
      right: 10,
      top: 0,
      itemWidth: 18,
      itemHeight: 9,
      textStyle: { color: cssVar('--el-text-color-regular') },
    },
    grid: {
      left: 0,
      right: 10,
      bottom: 10,
      top: 40,
      containLabel: true,
    },
    xAxis: {
      data: xData,
      type: 'category',
      boundaryGap: false,
      axisLabel: { color: cssVar('--el-text-color-secondary'), fontSize: 10 },
      axisLine: { lineStyle: { color: cssVar('--el-border-color-lighter') } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      interval: yInterval,
      axisLabel: { color: cssVar('--el-text-color-secondary') },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: cssVar('--el-border-color-lighter'),
        },
      },
    },
    series: [
      {
        type: 'line',
        name: '访问量',
        data: y1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        type: 'line',
        name: '收藏数',
        data: y2,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        type: 'line',
        name: '评论数',
        data: y3,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
}
