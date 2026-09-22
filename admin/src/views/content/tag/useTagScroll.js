/**
 * 标签卡片 / 标签云视图共享列表逻辑 — 滚动分页（追加式）
 *
 * 滚动触底自动加载下一页，每页 PAGE_SIZE 条。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { listApi } from '@/api/contag'
import { useTagEditor } from './useTagEditor'

// 滚动分页：每页条数
const PAGE_SIZE = 5

export function useTagScroll() {
  const searchData = ref({})
  const tableData = ref([])
  const page = ref(1)          // 已加载页码
  const total = ref(null)
  const loading = ref(false)     // 首屏/替换式请求中（骨架屏依据）
  const loadingMore = ref(false) // 翻页追加请求中（底部哨兵文案依据）
  const hasMore = ref(false)   // 是否还有更多
  const scrollable = ref(false) // 内容是否真的超出容器（未超出则无"下滑加载"语境）
  const loadMoreRef = ref(null) // 触底哨兵元素

  const { registerReload } = useTagEditor()

  // ============================================================
  // 渲染
  // ============================================================
  /** 回到第一页并刷新（替换式） */
  const render = async () => {
    // 开启loading动效
    loading.value = true
    try {
      page.value = 1
      const res = await listApi(page.value, PAGE_SIZE, searchData.value)
      tableData.value = res.data.items
      total.value = res.data.total
      hasMore.value = tableData.value.length < total.value
    } catch (error) {
      console.error('获取标签列表失败:', error)
    } finally {
      // 关闭loading动效
      loading.value = false
    }
  }

  /**
   * 骨架块数
   * 首屏拿不到总数（正在请求的就是它），退化为每页条数；
   * 之后用总数封顶 —— 不能直接按总数铺，总数 100 而一页只出 5 张会铺满屏再塌掉
   */
  const skeletonCount = computed(() => Math.min(total.value || PAGE_SIZE, PAGE_SIZE))

  /** 触底加载下一页（追加式） */
  const loadMore = async () => {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      page.value += 1
      const res = await listApi(page.value, PAGE_SIZE, searchData.value)
      tableData.value = tableData.value.concat(res.data.items)
      total.value = res.data.total
      hasMore.value = tableData.value.length < total.value
    } finally {
      loadingMore.value = false
    }
  }

  // ============================================================
  // 搜索和重置
  // ============================================================
  const onSearch = () => { render() }

  const onReset = () => {
    searchData.value = {}
    render()
  }

  // ============================================================
  // 滚动分页
  // ============================================================
  /** 哨兵进入视口即触发加载；首屏不足时自动补加载 */
  const checkLoadMore = () => {
    if (loading.value || loadingMore.value || !hasMore.value) return
    const el = loadMoreRef.value
    if (!el) return
    if (el.getBoundingClientRect().top <= window.innerHeight) {
      loadMore()
    }
  }

  /**
   * 检测内容是否撑破了滚动容器
   * 一屏放得下就没有"下滑加载"的语境，底部提示不该出现
   */
  const checkScrollable = () => {
    const wrap = document.querySelector('.main-scrollbar .el-scrollbar__wrap')
    scrollable.value = !!wrap && wrap.scrollHeight > wrap.clientHeight + 1
  }

  // 每次列表变化后重新检测（首屏不足 + 加载完成后继续补足 + 是否已可滚动）
  watch(tableData, () => {
    checkLoadMore()
    checkScrollable()
  }, { flush: 'post' })

  // 捕获阶段监听滚动：el-scrollbar 的滚动不冒泡，需 capture 才能捕获嵌套滚动
  onMounted(() => {
    window.addEventListener('scroll', checkLoadMore, true)
    window.addEventListener('resize', checkScrollable)
    render()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', checkLoadMore, true)
    window.removeEventListener('resize', checkScrollable)
  })

  registerReload(render)

  return {
    searchData, tableData, loading, loadingMore, skeletonCount, hasMore, scrollable, loadMoreRef,
    onSearch, onReset,
  }
}
