/**
 * 标签卡片 / 标签云视图共享列表逻辑 — 滚动分页（追加式）
 *
 * 滚动触底自动加载下一页，每页 PAGE_SIZE 条。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { listApi } from '@/api/contag'
import { useTagEditor } from './useTagEditor'

// 滚动分页：每页条数
const PAGE_SIZE = 5

export function useTagScroll() {
  const searchData = ref({})
  const tableData = ref([])
  const page = ref(1)          // 已加载页码
  const total = ref(null)
  const loading = ref(false)   // 加载中标志
  const hasMore = ref(false)   // 是否还有更多
  const loadMoreRef = ref(null) // 触底哨兵元素

  const { registerReload } = useTagEditor()

  // ============================================================
  // 渲染
  // ============================================================
  /** 回到第一页并刷新（替换式） */
  const render = async () => {
    page.value = 1
    const res = await listApi(page.value, PAGE_SIZE, searchData.value)
    tableData.value = res.data.items
    total.value = res.data.total
    hasMore.value = tableData.value.length < total.value
  }

  /** 触底加载下一页（追加式） */
  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    loading.value = true
    try {
      page.value += 1
      const res = await listApi(page.value, PAGE_SIZE, searchData.value)
      tableData.value = tableData.value.concat(res.data.items)
      total.value = res.data.total
      hasMore.value = tableData.value.length < total.value
    } finally {
      loading.value = false
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
    if (loading.value || !hasMore.value) return
    const el = loadMoreRef.value
    if (!el) return
    if (el.getBoundingClientRect().top <= window.innerHeight) {
      loadMore()
    }
  }

  // 每次列表变化后重新检测（首屏不足 + 加载完成后继续补足）
  watch(tableData, checkLoadMore, { flush: 'post' })

  // 捕获阶段监听滚动：el-scrollbar 的滚动不冒泡，需 capture 才能捕获嵌套滚动
  onMounted(() => {
    window.addEventListener('scroll', checkLoadMore, true)
    render()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', checkLoadMore, true)
  })

  registerReload(render)

  return {
    searchData, tableData, loading, hasMore, loadMoreRef,
    onSearch, onReset,
  }
}
