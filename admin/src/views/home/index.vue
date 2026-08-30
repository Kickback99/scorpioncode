<template>
  <div class="dashboard">
    <!-- ===== 顶部区域：问候 + 统计 ===== -->
    <el-card v-if="topCardVisible" class="top-card" shadow="hover">
      <div class="top-content">
        <!-- 左侧：问候语 -->
        <div class="profile-section">
          <div class="profile-info">
            <h2 class="greeting">{{ greeting }}，{{ nickname }}，今天又是充满活力的一天！</h2>
            <p class="hitokoto">{{ hitokoto }}</p>
          </div>
        </div>

        <!-- 右侧：统计数字组 -->
        <div class="stats-row">
          <div class="stat-chip">
            <span class="stat-chip-label">文章</span>
            <span class="stat-chip-value">{{ dashboard.articleCount ?? 0 }}</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-chip">
            <span class="stat-chip-label">已发布</span>
            <span class="stat-chip-value">{{ dashboard.publishedCount ?? 0 }}</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-chip">
            <span class="stat-chip-label">评论</span>
            <span class="stat-chip-value">{{ dashboard.commentCount ?? 0 }}</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-chip">
            <span class="stat-chip-label">草稿</span>
            <span class="stat-chip-value">{{ dashboard.draftCount ?? 0 }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ===== 中间：概览卡片 ===== -->
    <el-row :gutter="14" class="overview-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-icon icon-primary">
            <el-icon><View /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-label">总访问数</div>
            <div class="card-value"><CountTo :end-val="dashboard.totalViewCount ?? 0" /></div>
            <div class="card-stats">
              <span class="today-val">今日 {{ dashboard.todayViewCount ?? 0 }}</span>
              <span class="growth" :class="growthClass(dashboard.viewsGrowth)">
                <el-icon v-if="growthArrow(dashboard.viewsGrowth)"><CaretTop /></el-icon>
                <el-icon v-else-if="growthArrowDown(dashboard.viewsGrowth)"><CaretBottom /></el-icon>
                {{ growthValue(dashboard.viewsGrowth) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-icon icon-success">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-label">在线总人数</div>
            <div class="card-value"><CountTo :end-val="onlineTotal" /></div>
            <div class="card-stats">
              <span class="today-val">今日 {{ onlineTodayCount }}</span>
              <span class="growth" :class="growthClass(onlineGrowth)">
                <el-icon v-if="growthArrow(onlineGrowth)"><CaretTop /></el-icon>
                <el-icon v-else-if="growthArrowDown(onlineGrowth)"><CaretBottom /></el-icon>
                {{ growthValue(onlineGrowth) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-icon icon-danger">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-label">总文章数</div>
            <div class="card-value"><CountTo :end-val="dashboard.articleCount ?? 0" /></div>
            <div class="card-stats">
              <span class="today-val">已发布 {{ dashboard.publishedCount ?? 0 }}</span>
              <span class="growth neutral"><SingleIcon icon="ri:pulse-fill"></SingleIcon>{{ articlePct }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-icon icon-success">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-label">总评论数</div>
            <div class="card-value"><CountTo :end-val="dashboard.commentCount ?? 0" /></div>
            <div class="card-stats">
              <span class="today-val">今日 {{ dashboard.todayCommentCount ?? 0 }}</span>
              <span class="growth" :class="growthClass(dashboard.commentsGrowth)">
                <el-icon v-if="growthArrow(dashboard.commentsGrowth)"><CaretTop /></el-icon>
                <el-icon v-else-if="growthArrowDown(dashboard.commentsGrowth)"><CaretBottom /></el-icon>
                {{ growthValue(dashboard.commentsGrowth) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="overview-card" shadow="hover">
          <div class="card-icon icon-warning">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-label">用户总数</div>
            <div class="card-value"><CountTo :end-val="dashboard.userCount ?? 0" /></div>
            <div class="card-stats">
              <span class="today-val">今日 {{ dashboard.todayUserCount ?? 0 }}</span>
              <span class="growth" :class="growthClass(dashboard.usersGrowth)">
                <el-icon v-if="growthArrow(dashboard.usersGrowth)"><CaretTop /></el-icon>
                <el-icon v-else-if="growthArrowDown(dashboard.usersGrowth)"><CaretBottom /></el-icon>
                {{ growthValue(dashboard.usersGrowth) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 第一排：Gauge + AreaChart ===== -->
    <el-row :gutter="14" class="section-row">
      <el-col :xs="24" :md="12">
        <GaugeGroup :items="gaugeData" />
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never" @mouseenter="hoverArea = true" @mouseleave="hoverArea = false">
          <template #header>
            <div class="chart-header">
              <span>近7天文章访问趋势</span>
              <WeekArrows
                :period-label="areaChart.periodLabel"
                :left-disabled="areaOffset >= areaChart.maxOffset || !areaChart.hasPrev"
                :right-disabled="areaStack.length === 0"
                :loading="areaLoading"
                :offset="areaOffset"
                :max-offset="areaChart.maxOffset"
                @prev="handleAreaPrev"
                @next="handleAreaNext"
                @reset="handleAreaReset"
              />
            </div>
          </template>
          <AreaChart :x-data="areaChart.xData" :y1="areaChart.y1" :has-data="areaChart.hasData" />
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 第二排：LineChart + PieChart ===== -->
    <el-row :gutter="14" class="section-row">
      <el-col :xs="24" :md="15">
        <el-card shadow="never" @mouseenter="hoverLine = true" @mouseleave="hoverLine = false">
          <template #header>
            <div class="chart-header">
              <span>近7天文章数据趋势</span>
              <WeekArrows
                :period-label="lineChart.periodLabel"
                :left-disabled="lineOffset >= lineChart.maxOffset || !lineChart.hasPrev"
                :right-disabled="prevStack.length === 0"
                :loading="lineLoading"
                :offset="lineOffset"
                :max-offset="lineChart.maxOffset"
                @prev="handleWeekPrev"
                @next="handleWeekNext"
                @reset="handleWeekReset"
              />
            </div>
          </template>
          <LineChart :x-data="lineChart.xData" :y1="lineChart.y1" :y2="lineChart.y2" :y3="lineChart.y3" :has-data="lineChart.hasData" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="9">
        <el-card shadow="never">
          <template #header>
            <div class="chart-header"><span>分类统计</span></div>
          </template>
          <PieChart :legend-data="pieChart.legendData" :series-data="pieChart.seriesData" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { View, TrendCharts, ChatDotRound, UserFilled, CaretTop, CaretBottom, Connection } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useConfigStore } from '@/store/config'
import LineChart from './charts/LineChart.vue'
import PieChart from './charts/PieChart.vue'
import GaugeGroup from './charts/GaugeGroup.vue'
import AreaChart from './charts/AreaChart.vue'
import WeekArrows from './charts/WeekArrows.vue'
import CountTo from '@/components/CountTo/index.vue'
import { getDashboardApi, getChartLineApi, getChartPieApi, getChartsGaugeApi, getChartAreaApi } from '@/api/dashboard'
import websocketManager from '@/server/websocketManager'

// ============================================================
// 数据
// ============================================================
const userStore = useUserStore()
const configStore = useConfigStore()
const dashboard = reactive({})
const onlineTotal = ref(0)
const onlineTodayCount = ref(0)
const onlineGrowth = ref(null)
const lineOffset = ref(0)
const initialOffset = ref(null)
const prevStack = ref([])
const lineLoading = ref(false)
const fallbackMaxOffset = configStore.getDashboardLineChartWeekOffset() || 12
const lineChart = reactive({ xData: [], y1: [], y2: [], y3: [], periodLabel: '', hasData: false, isLatest: false, maxOffset: fallbackMaxOffset, hasPrev: true })
const pieChart = reactive({ legendData: [], seriesData: [] })
const gaugeData = ref([])
const areaChart = reactive({ xData: [], y1: [], periodLabel: '', hasData: false, maxOffset: 12, hasPrev: true })
const areaOffset = ref(0)
const areaStack = ref([])
const areaLoading = ref(false)
const areaInitialOffset = ref(null)
const hoverArea = ref(false)
const hoverLine = ref(false)
const hitokoto = ref('加载中...')

// ============================================================
// 计算属性
// ============================================================
const topCardVisible = computed(() => configStore.getDashboardTopCardEnabled())

const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || 'Admin')

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6)  return '凌晨好'
  if (h < 9)  return '早安'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 17) return '下午好'
  if (h < 19) return '傍晚好'
  if (h < 22) return '晚上好'
  return '夜深了'
})

// ============================================================
// 百分比 & 增长率
// ============================================================
const pct = (part, total) => total > 0 ? (part / total * 100).toFixed(1) : '0'
const articlePct = computed(() => pct(dashboard.publishedCount, dashboard.articleCount))
const growthClass = (v) => {
  if (v == null) return 'neutral'
  const n = Number(v)
  if (n > 0) return 'positive'
  if (n < 0) return 'negative'
  return 'neutral'
}
const growthArrow = (v) => v != null && Number(v) > 0
const growthArrowDown = (v) => v != null && Number(v) < 0
const growthValue = (v) => v == null ? '--' : `${Number(v).toFixed(2)}%`

// ============================================================
// 在线用户实时数据（websocket online_users_update）
// ============================================================
const handleOnlineUsersUpdate = (event) => {
  const data = event.detail
  if (data && data.type === 'online_users_update') {
    onlineTotal.value = data.total ?? 0
    onlineTodayCount.value = data.todayOnlineCount ?? 0
    onlineGrowth.value = data.onlineGrowth ?? null
  }
}

// ============================================================
// 一言
// ============================================================
const fetchHitokoto = async () => {
  try {
    const res = await fetch('https://api.pearapi.ai/api/hitokoto/')
    const text = await res.text()
    hitokoto.value = text || '静心沉淀，代码生花。'
  } catch {
    hitokoto.value = '静心沉淀，代码生花。'
  }
}

// ============================================================
// 数据请求
// ============================================================
const fetchDashboard = async () => {
  try {
    const res = await getDashboardApi()
    Object.assign(dashboard, res.data)
  } catch { /* keep defaults */ }
}

const fetchLineChart = async (direction = 'prev') => {
  lineLoading.value = true
  try {
    const res = await getChartLineApi(lineOffset.value, initialOffset.value, direction)
    lineChart.xData = res.data?.xdata || res.data?.xData || []
    lineChart.y1 = res.data?.y1 || []
    lineChart.y2 = res.data?.y2 || []
    lineChart.y3 = res.data?.y3 || []
    lineChart.periodLabel = res.data?.periodLabel || ''
    lineChart.hasData = res.data?.hasData || false
    const actual = res.data?.offset ?? lineOffset.value
    lineOffset.value = actual
    if (initialOffset.value === null) {
      initialOffset.value = actual
    }
    const max = res.data?.maxOffset ?? 0
    lineChart.maxOffset = max
    lineChart.hasPrev = res.data?.hasPrev ?? true
    lineChart.isLatest = actual <= 0 || actual === initialOffset.value
  } catch { /* keep defaults */ }
  lineLoading.value = false
}

const fetchPieChart = async () => {
  try {
    const res = await getChartPieApi()
    pieChart.legendData = res.data?.legendData || []
    pieChart.seriesData = res.data?.seriesData || []
  } catch { /* keep defaults */ }
}

// ============================================================
// 周切换
// ============================================================
const handleWeekPrev = () => { prevStack.value = [...prevStack.value, lineOffset.value]; lineOffset.value++; fetchLineChart('prev') }
const handleWeekReset = () => { prevStack.value = []; lineOffset.value = 0; fetchLineChart('prev') }
const handleWeekNext = () => {
  const s = prevStack.value
  if (s.length === 0) return
  lineOffset.value = s[s.length - 1]
  prevStack.value = s.slice(0, -1)
  fetchLineChart('next')
}

// ============================================================
// 生命周期
// ============================================================
const onKey = (e) => {
  if (e.target.matches('input, textarea, [contenteditable]')) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Escape') {
    e.preventDefault()
    if (e.key === 'Escape') {
      if (hoverArea.value) handleAreaReset()
      if (hoverLine.value) handleWeekReset()
      if (!hoverArea.value && !hoverLine.value) { handleWeekReset(); handleAreaReset() }
      return
    }
    const area = hoverArea.value
    if (e.key === 'ArrowLeft') {
      if (area && areaChart.hasPrev && areaOffset.value < areaChart.maxOffset) handleAreaPrev()
      else if (lineChart.hasPrev && lineOffset.value < lineChart.maxOffset) handleWeekPrev()
    } else {
      if (area && areaStack.value.length > 0)              handleAreaNext()
      else if (prevStack.value.length > 0)                 handleWeekNext()
    }
  }
}

onMounted(() => {
  if (topCardVisible.value) {
    fetchHitokoto()
  }
  fetchDashboard()
  fetchLineChart()
  fetchPieChart()
  fetchGauge()
  fetchAreaChart()
  window.addEventListener('keydown', onKey)

  // 在线用户：取缓存（解决刷新）+ 监听后续推送（解决实时）
  const cached = websocketManager.getCachedOnlineUsers()
  if (cached) handleOnlineUsersUpdate({ detail: cached })
  window.addEventListener('online-users-update', handleOnlineUsersUpdate)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('online-users-update', handleOnlineUsersUpdate)
})

// ============================================================
// Gauge + Area
// ============================================================
const fetchGauge = async () => {
  try {
    const res = await getChartsGaugeApi()
    gaugeData.value = res.data?.items || []
  } catch { /* keep defaults */ }
}

const fetchAreaChart = async (direction = 'prev') => {
  areaLoading.value = true
  try {
    const res = await getChartAreaApi(areaOffset.value, areaInitialOffset.value, direction)
    Object.assign(areaChart, {
      xData: res.data?.xdata || res.data?.xData || [],
      y1: res.data?.y1 || [],
      periodLabel: res.data?.periodLabel || '',
      hasData: res.data?.hasData || false,
      maxOffset: res.data?.maxOffset || 12,
      hasPrev: res.data?.hasPrev ?? true,
    })
    areaOffset.value = res.data?.offset ?? areaOffset.value
    if (areaInitialOffset.value === null) {
      areaInitialOffset.value = areaOffset.value
    }
  } catch { /* keep defaults */ }
  areaLoading.value = false
}

const handleAreaPrev = () => { areaStack.value = [...areaStack.value, areaOffset.value]; areaOffset.value++; fetchAreaChart('prev') }
const handleAreaNext = () => {
  const s = areaStack.value
  if (s.length === 0) return
  areaOffset.value = s[s.length - 1]
  areaStack.value = s.slice(0, -1)
  fetchAreaChart('next')
}
const handleAreaReset = () => { areaStack.value = []; areaOffset.value = 0; areaInitialOffset.value = null; fetchAreaChart('prev') }
</script>

<style scoped lang="scss">
.dashboard {
  // ===== 顶部卡片 =====
  .top-card {
    margin-bottom: 14px;

    :deep(.el-card__body) {
      padding: 24px 28px;
    }

    .top-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
    }

    .profile-section {
      flex: 1;
      min-width: 0;

      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 8px 0;
      }

      .hitokoto {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }

    .stats-row {
      display: flex;
      align-items: center;
      gap: 32px;
      flex-shrink: 0;

      .stat-chip {
        text-align: center;

        .stat-chip-label {
          display: block;
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }

        .stat-chip-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--el-text-color-primary);
        }
      }

      .stat-divider {
        width: 1px;
        height: 36px;
        background-color: var(--el-border-color-lighter);
      }
    }
  }

  // ===== 概览卡片 =====
  .overview-cards {
    margin-bottom: 14px;
    row-gap: 14px; // 移动端卡片上下堆叠时的间距（桌面单行时无影响）

    // 5 张卡在 md+ 均分一行（覆盖 el-col 默认 4 列 25% 宽度，改为 20%）
    @media (min-width: 992px) {
      :deep(.el-col) {
        flex: 0 0 20%;
        max-width: 20%;
      }
    }

    .overview-card {
      border-radius: 10px;
      border: none;
      transition: box-shadow 0.3s;

      :deep(.el-card__body) {
        padding: 18px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;

        &.icon-primary   { background-color: var(--el-color-primary-light-9);  color: var(--el-color-primary); }
        &.icon-danger    { background-color: var(--el-color-danger-light-9); color: var(--el-color-danger); }
        &.icon-success   { background-color: var(--el-color-success-light-9); color: var(--el-color-success); }
        &.icon-warning   { background-color: var(--el-color-warning-light-9); color: var(--el-color-warning); }
      }

      .card-body {
        flex: 1;
        min-width: 0;

        .card-label {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }

        .card-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--el-text-color-primary);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .card-stats {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px;

          .today-val { color: var(--el-text-color-secondary); }
          .growth {
            display: flex; align-items: center; gap: 2px; font-weight: 400; scale: 0.9;
            &.positive  { color: var(--el-color-success); }
            &.negative  { color: var(--el-color-danger); }
            &.neutral   { color: var(--el-text-color-secondary); }
          }
        }
      }
    }
  }

  // ===== 图表 =====
  .section-row, .charts-row {
    margin-bottom: 14px;

    :deep(.el-card) { height: 100%; border-radius: 10px; border: none; }

    :deep(.el-card__header) { border-bottom: none; }

    .chart-header {
      display: flex; align-items: center; gap: 10px;
      flex-wrap: nowrap;
      font-size: 15px; font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

// ===== 响应式 =====
@media (max-width: 991px) {
  .dashboard .top-card .top-content {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
