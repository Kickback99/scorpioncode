/**
 * 公告列表逻辑 — 滚动加载（哨兵触底追加）/ 分页加载（el-pagination）
 *
 * 未读 / 已读各调用一次 useNoticeList，得到两套互相独立的列表状态。
 * 加载方式由调用方传入 isScrollMode（配置项 notice.load_mode）决定，
 * 分页模式下哨兵不渲染，观察器自然不会建立。
 */
import { computed, onUnmounted, ref, watch } from 'vue'

/**
 * 创建一套公告列表状态与加载器
 * @param {Object} options
 * @param {Function} options.fetchApi 列表接口，(pageNum, pageSize) => Promise
 * @param {string} options.label 日志标签
 * @param {Ref<boolean>} options.isScrollMode 是否滚动加载
 * @param {Ref<number>} options.pageSize 每页条数
 * @returns {Object} 列表状态、滚动容器 / 哨兵引用、重置加载方法
 */
export function useNoticeList({ fetchApi, label, isScrollMode, pageSize }) {
  const list = ref([])
  const total = ref(0)
  const pageNum = ref(1)
  const loading = ref(false)      // 首次 / 重置加载
  const loadingMore = ref(false)  // 触底加载更多
  const hasMore = computed(() => list.value.length < total.value)
  const containerRef = ref(null)  // 滚动容器（同时作为 IntersectionObserver 的 root）
  const sentinelRef = ref(null)   // 触底哨兵
  const scrollable = ref(false)   // 列表是否超出容器（供模板判断要不要显示滚动提示）

  // ============================================================
  // 渲染
  // ============================================================
  /** 重置加载：回到第 1 页并替换列表 */
  const load = async () => {
    // 滚动模式的页码由本函数维护，重置时必须归 1；
    // 分页模式的页码由 el-pagination 维护，不能覆盖
    if (isScrollMode.value) pageNum.value = 1
    loading.value = true
    try {
      const res = await fetchApi(pageNum.value, pageSize.value)
      list.value = res.data?.items || []
      total.value = res.data?.total || 0
    } catch (e) {
      console.error(`获取${label}公告列表失败:`, e)
    } finally {
      loading.value = false
    }
  }

  /** 触底加载：取下一页并追加到列表末尾 */
  const loadMore = async () => {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const nextPage = pageNum.value + 1
      const res = await fetchApi(nextPage, pageSize.value)
      list.value = [...list.value, ...(res.data?.items || [])]
      total.value = res.data?.total || 0
      pageNum.value = nextPage
    } catch (e) {
      console.error(`加载更多${label}公告失败:`, e)
    } finally {
      loadingMore.value = false
    }
  }

  // ============================================================
  // 滚动加载
  // ============================================================
  /** 测量列表是否超出容器：一屏就放得下时，「没有更多了」纯属多余 */
  const checkScrollable = () => {
    const el = containerRef.value
    if (el) scrollable.value = el.scrollHeight > el.clientHeight
  }

  watch(list, checkScrollable, { flush: 'post' })

  // 哨兵进入滚动容器视口即加载下一页；哨兵为 v-if 渲染，出现 / 消失时重建观察器
  let observer = null
  watch([sentinelRef, containerRef], ([sentinel, root]) => {
    observer?.disconnect()
    observer = null
    if (!sentinel || !root) return
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    }, { root })
    observer.observe(sentinel)
  }, { flush: 'post' })

  onUnmounted(() => observer?.disconnect())

  return { list, total, pageNum, loading, loadingMore, hasMore, scrollable, containerRef, sentinelRef, load }
}
