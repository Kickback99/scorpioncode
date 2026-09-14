/**
 * 标签表格视图列表逻辑 — 分页（替换式），仅 TagTable 使用
 */
import { ref } from 'vue'
import { listApi } from '@/api/contag'
import { useTagEditor } from './useTagEditor'

export function useTagTable() {
  const searchData = ref({})
  const tableData = ref([])
  const params = ref({ pageNum: 1, pageSize: 10 })
  const total = ref(null)

  const { registerReload } = useTagEditor()

  // ============================================================
  // 渲染
  // ============================================================
  const render = async () => {
    const res = await listApi(params.value.pageNum, params.value.pageSize, searchData.value)
    tableData.value = res.data.items
    total.value = res.data.total
  }

  /** 回到第一页并刷新（增删改成功后、搜索、重置、每页条数变化时调用） */
  const reload = () => {
    params.value.pageNum = 1
    render()
  }

  // ============================================================
  // 分页
  // ============================================================
  const onSizeChange = (size) => {
    params.value.pageSize = size
    reload()
  }

  const onCurrentChange = (page) => {
    params.value.pageNum = page
    render()
  }

  // ============================================================
  // 搜索和重置
  // ============================================================
  const onSearch = () => { reload() }

  const onReset = () => {
    searchData.value = {}
    reload()
  }

  registerReload(reload)
  render()

  return {
    searchData, tableData, params, total,
    onSizeChange, onCurrentChange, onSearch, onReset,
  }
}
