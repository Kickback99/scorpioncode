// api/dashboard.js
import http from '@/utils/request'

const API = {
  DASHBOARD: '/admin/dashboard',
  CHARTS_BAR: '/admin/charts/bar',
  CHART_LINE: '/admin/chart/line',
  CHART_PIE: '/admin/chart/pie',
  CHART_AREA: '/admin/chart/area',
}

/**
 * 获取仪表盘卡片统计数据
 * @returns {Promise} 9 个概览指标
 */
export const getDashboardApi = () => http.get(API.DASHBOARD)

/**
 * 获取近7天柱状图数据
 * @returns {Promise} { xData:[], y1:[] }
 */
export const getChartsBarApi = () => http.get(API.CHARTS_BAR)

/**
 * 获取近7天折线图数据
 * @param {number} [offset=0] 周偏移（0=本周，1=上周...）
 * @returns {Promise} { xData:[], y1:[], y2:[], y3:[], periodLabel, hasData, offset }
 */
export const getChartLineApi = (offset = 0, initialOffset = null, direction = 'prev') => http.get(API.CHART_LINE, { params: { offset, initialOffset, direction } })

/**
 * 获取文章状态饼图数据
 * @returns {Promise} { legendData:[], seriesData:[] }
 */
export const getChartPieApi = () => http.get(API.CHART_PIE)

/**
 * 获取近7天面积图数据
 * @param {number} [offset=0] 周偏移
 * @param {number} [initialOffset=null]
 * @param {string} [direction='prev'] 切换方向
 * @returns {Promise} { xData:[], y1:[], periodLabel, hasData, offset, maxOffset }
 */
export const getChartAreaApi = (offset = 0, initialOffset = null, direction = 'prev') =>
  http.get(API.CHART_AREA, { params: { offset, initialOffset, direction } })

/**
 * 获取环形仪表盘数据
 * @returns {Promise} { items: [{label, value, color}] }
 */
export const getChartsGaugeApi = () => http.get('/admin/charts/gauge')
