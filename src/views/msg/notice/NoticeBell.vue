<template>
  <!-- 固定右下角铃铛按钮 -->
  <div class="notice-bell-wrapper">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
      <el-button size="small" circle :icon="Bell" plain @click="handleTogglePopover" />
    </el-badge>
  </div>

  <!-- 弹出列表卡片 -->
  <el-popover
    :visible="popoverVisible"
    placement="top-end"
    :width="popoverWidth"
    trigger="manual"
    :hide-on-click="false"
    @hide="popoverVisible = false"
  >
    <template #reference>
      <div style="position: fixed; bottom: 20px; right: 20px; width: 0; height: 0;" />
    </template>

    <div class="popover-header">
      <span class="popover-title">公告通知</span>
      <div class="popover-header-actions">
        <el-button v-if="unreadCount > 0" type="primary" link size="small" @click="handleMarkAllRead">全部已读</el-button>
        <el-button :icon="Close" link size="small" @click="popoverVisible = false" />
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="未读" name="unread">
        <div ref="unreadListRef" v-loading="loading" class="notice-list">
          <div v-for="item in unreadList" :key="item.id" class="notice-item">
            <span class="notice-title">{{ item.title  || '公告消息' }}</span>
            <div class="notice-actions">
              <el-button type="primary" link size="small" @click="handleViewDetail(item)">查看详情</el-button>
              <el-button type="success" link size="small" @click="handleMarkRead(item.id)">已读</el-button>
            </div>
          </div>
          <!-- 滚动加载：哨兵进入列表视口即加载下一页（哨兵不能加 scrollable 判定，否则撑不满一屏时取不到后续数据） -->
          <div v-if="isScrollMode && unreadHasMore" ref="unreadSentinelRef" class="load-more-tip">
            <el-icon v-if="unreadLoadingMore" class="is-loading"><Loading /></el-icon>
            <span>{{ unreadLoadingMore ? '加载中...' : '下滑加载更多' }}</span>
          </div>
          <div v-else-if="isScrollMode && unreadScrollable && unreadList.length > 0" class="load-more-tip">没有更多了</div>
          <el-empty v-if="!loading && unreadList.length === 0" description="暂无未读公告" :image-size="0" class="empty-no-icon"/>
        </div>
        <!-- 分页（仅分页加载模式） -->
        <div v-if="!isScrollMode && unreadTotal > pageSize" class="notice-pagination">
          <el-pagination
            v-model:current-page="pageNum"
            :page-size="pageSize"
            :total="unreadTotal"
            size="small"
            layout="prev, pager, next"
            @current-change="fetchUnreadList"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="已读" name="read">
        <div ref="readListRef" v-loading="readLoading" class="notice-list">
          <div v-for="item in readList" :key="item.id" class="notice-item">
            <span class="notice-title">{{ item.title || '公告消息' }}</span>
            <div class="notice-actions">
              <el-button type="primary" link size="small" @click="handleViewDetail(item)">查看详情</el-button>
            </div>
          </div>
          <!-- 滚动加载：哨兵进入列表视口即加载下一页（哨兵不能加 scrollable 判定，否则撑不满一屏时取不到后续数据） -->
          <div v-if="isScrollMode && readHasMore" ref="readSentinelRef" class="load-more-tip">
            <el-icon v-if="readLoadingMore" class="is-loading"><Loading /></el-icon>
            <span>{{ readLoadingMore ? '加载中...' : '下滑加载更多' }}</span>
          </div>
          <div v-else-if="isScrollMode && readScrollable && readList.length > 0" class="load-more-tip">没有更多了</div>
          <el-empty v-if="!readLoading && readList.length === 0" description="暂无已读公告" :image-size="0" />
        </div>
        <!-- 分页（仅分页加载模式） -->
        <div v-if="!isScrollMode && readTotal > pageSize" class="notice-pagination">
          <el-pagination
            v-model:current-page="readPageNum"
            :page-size="pageSize"
            :total="readTotal"
            size="small"
            layout="prev, pager, next"
            @current-change="fetchReadList"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :title="currentNotice?.title || '公告消息'" :width="dialogWidth" destroy-on-close
      class="notice-detail-dialog">
    <div class="notice-meta">
      <span class="meta-time">推送时间：{{ currentNotice?.pushTime || '-' }}</span>
    </div>
    <el-divider />
    <div v-if="currentNotice?.type === 0" class="notice-body">{{ currentNotice?.content || '' }}</div>
    <div v-else :class="{ 'dark-mode': userConfigStore.isDarkEnabled }" class="detail-panel">
      <component :is="MarkdownPreview" :key="userConfigStore.isDarkEnabled" :text="currentNotice?.content || ''" @click="handleCopyCodeSuccess" />
    </div>
  </el-dialog>
</template>

<script setup>
// ============================================================
// 导入
// ============================================================
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue'
import { Bell, Close, Loading } from '@element-plus/icons-vue'
import { noticeUnreadListApi, noticeUnreadCountApi, noticeMarkReadApi, noticeReadListApi, noticeMarkAllReadApi } from '@/api/notice'
import { useUserConfigStore } from '@/store/userConfig'
import { useConfigStore } from '@/store/config'
import { useNoticeList } from './useNoticeList'

const userConfigStore = useUserConfigStore()
const configStore = useConfigStore()
// Markdown 预览组件：懒加载 v-md-editor + 跟随深浅模式实时切换主题（computed + key）
const MarkdownPreview = computed(() => {
  const theme = userConfigStore.isDarkEnabled ? 'vuepress' : 'github'
  return defineAsyncComponent(() =>
    import('@/utils/markdown-config').then((m) =>
      m.createMarkdownPreview(theme, true),
    ),
  )
})

// ============================================================
// 状态
// ============================================================
const popoverVisible = ref(false)
const activeTab = ref('unread')
const unreadCount = ref(0)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentNotice = ref(null)

// 加载方式（配置项 notice_load_mode）：scroll=滚动加载，pagination=分页加载
const isScrollMode = computed(() => configStore.getNoticeLoadMode() === 'scroll')

// ============================================================
// 响应式中屏幕检测
// ============================================================
const isMediumDown = ref(false)
const mediaQuery = window.matchMedia('(max-width: 991px)')
const popoverWidth = computed(() => isMediumDown.value ? 320 : 420)
const dialogWidth = computed(() => isMediumDown.value ? '90%' : '650px')

function handleMediaChange(e) {
  isMediumDown.value = e.matches
}

// ============================================================
// 公告列表 — 未读 / 已读 各一套状态（加载逻辑见 useNoticeList）
// ============================================================

// 未读列表
const {
  list: unreadList, total: unreadTotal, pageNum, loading,
  loadingMore: unreadLoadingMore, hasMore: unreadHasMore, scrollable: unreadScrollable,
  containerRef: unreadListRef, sentinelRef: unreadSentinelRef,
  load: fetchUnreadList,
} = useNoticeList({ fetchApi: noticeUnreadListApi, label: '未读', isScrollMode, pageSize })

// 已读列表
const {
  list: readList, total: readTotal, pageNum: readPageNum, loading: readLoading,
  loadingMore: readLoadingMore, hasMore: readHasMore, scrollable: readScrollable,
  containerRef: readListRef, sentinelRef: readSentinelRef,
  load: fetchReadList,
} = useNoticeList({ fetchApi: noticeReadListApi, label: '已读', isScrollMode, pageSize })

// ============================================================
// 数据获取
// ============================================================
const fetchUnreadCount = async () => {
  try {
    const res = await noticeUnreadCountApi()
    unreadCount.value = res.data || 0
  } catch (e) {
    console.error('获取未读数量失败:', e)
  }
}

// ============================================================
// 操作
// ============================================================
const handleTogglePopover = () => {
  popoverVisible.value = !popoverVisible.value
  if (popoverVisible.value) {
    fetchUnreadCount()
    pageNum.value = 1
    if (activeTab.value === 'unread') {
      fetchUnreadList()
    } else {
      readPageNum.value = 1
      fetchReadList()
    }
  }
}

const handleTabChange = (tab) => {
  fetchUnreadCount()
  readPageNum.value = 1
  pageNum.value = 1
  if (tab === 'read') {
    fetchReadList()
  } else {
    fetchUnreadList()
  }
}

const handleViewDetail = (notice) => {
  currentNotice.value = notice
  detailVisible.value = true
}

const handleMarkRead = async (noticeId) => {
  try {
    await noticeMarkReadApi(noticeId)
    fetchUnreadCount()
    if (isScrollMode.value) {
      // 滚动模式：本地移除已读项，保留已加载的分页与滚动位置
      unreadList.value = unreadList.value.filter(item => item.id !== noticeId)
      unreadTotal.value = Math.max(0, unreadTotal.value - 1)
    } else {
      fetchUnreadList()
    }
    // 已读 Tab 已有数据时刷新
    if (readList.value.length > 0) {
      readPageNum.value = 1
      fetchReadList()
    }
  } catch (e) {
    console.error('标记已读失败:', e)
  }
}

const handleMarkAllRead = async () => {
  try {
    await noticeMarkAllReadApi()
    unreadCount.value = 0
    unreadList.value = []
    unreadTotal.value = 0
  } catch (e) {
    console.error('全部已读失败:', e)
  }
}

const handleCopyCodeSuccess = (e) => {
  const btn = e.target.closest('.v-md-copy-code-btn')
  if (!btn) return
  btn.classList.add('copied')
  setTimeout(() => btn.classList.remove('copied'), 1500)
}

// ============================================================
// WebSocket 事件处理
// ============================================================
let syncTimer = null
const handleNoticePush = () => {
  // 乐观更新：立即 +1，避免竞态
  unreadCount.value++
  // 如果弹窗已打开，同时刷新列表
  if (popoverVisible.value) {
    fetchUnreadList()
  }
  // 去抖同步：300ms 内多次推送只发一次 API 校准
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => fetchUnreadCount(), 300)
}

const handleNoticeRefresh = () => {
  clearTimeout(syncTimer)
  fetchUnreadCount()
  if (popoverVisible.value) {
    if (activeTab.value === 'unread') fetchUnreadList()
    else fetchReadList()
  }
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  isMediumDown.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMediaChange)
  fetchUnreadCount()
  window.addEventListener('notice-push', handleNoticePush)
  window.addEventListener('notice-refresh', handleNoticeRefresh)
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', handleMediaChange)
  window.removeEventListener('notice-push', handleNoticePush)
  window.removeEventListener('notice-refresh', handleNoticeRefresh)
})

// ============================================================
// 暴露
// ============================================================
defineExpose({})
</script>

<style lang="scss" scoped>
.notice-bell-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;

  :deep(.el-badge__content) {
    background-color: var(--el-color-danger);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 4px;
  // border-bottom: 1px solid var(--el-border-color-lighter);

  .popover-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .popover-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.notice-list {
  // 纵向弹性布局：列表未撑满容器时，剩余的空白交给哨兵吸收（见 .load-more-tip）
  display: flex;
  flex-direction: column;
  // 未读 / 已读 固定同一高度，切换 tab 时弹窗不会上下跳动
  height: 250px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--el-color-primary-light-5) 35%, transparent);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.load-more-tip {
  // 列表未撑满容器时吸收剩余空间，文字在其中垂直居中 → 上下间距始终相等
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.notice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;   // 列表撑满容器时保持行高，避免被压扁

  &:last-child {
    border-bottom: none;
  }

  // 后面紧跟哨兵时，下间距完全交给哨兵，保证其上下等距
  &:has(+ .load-more-tip) {
    padding-bottom: 0;
    border-bottom: none;
  }

  .notice-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-primary);
    margin-right: 8px;
  }

  .notice-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}

.notice-pagination {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 12px;

  .meta-time {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.notice-body {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-primary);
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--el-color-primary-light-5) 35%, transparent);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

:deep(.el-empty .el-empty__image) {
  display: none !important;
  margin: 0;
}

/* 公告图片样式（公告详情弹窗专用，不抽取到公共样式） */
.detail-panel {
  :deep(.v-md-editor-preview img) {
    display: block !important;
    width: $notice-img !important;
    margin: auto !important;
  }
}
</style>

<style lang="scss">
/* 详情弹窗滚动条同步 index.scss 半透明风格 */
.el-overlay:has(.notice-detail-dialog) .el-overlay-dialog::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.el-overlay:has(.notice-detail-dialog) .el-overlay-dialog::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--el-color-primary-light-5) 35%, transparent);
  border-radius: 2px;
}
.el-overlay:has(.notice-detail-dialog) .el-overlay-dialog::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
}
.el-overlay:has(.notice-detail-dialog) .el-overlay-dialog::-webkit-scrollbar-track {
  background: transparent;
}
</style>
