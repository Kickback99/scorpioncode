/**
 * 标签管理共享逻辑 — TagTable / TagCard / TagCloud 三个变体共享
 *
 * 状态为模块级单例，无论哪个组件调用 useTagList() 都共享同一份数据。
 */
import { nextTick, onMounted, ref } from 'vue'
import { addApi, listApi, modifyApi, removeApi } from '@/api/contag'
import msg from '@/components/msg'

// ============================================================
// 模块级单例状态
// ============================================================
const searchData = ref({})
const tableData = ref([])
const params = ref({ pageNum: 1, pageSize: 10 })
const total = ref(null)

const ruleFormRef = ref(null)
const dialogVisible = ref(false)
const formModel = ref({})
const title = ref('')

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

// ============================================================
// 渲染
// ============================================================
const render = async () => {
  const res = await listApi(params.value.pageNum, params.value.pageSize, searchData.value)
  tableData.value = res.data.items
  total.value = res.data.total
}

// ============================================================
// 分页
// ============================================================
const onSizeChange = (size) => {
  params.value.pageNum = 1
  params.value.pageSize = size
  render()
}

const onCurrentChange = (page) => {
  params.value.pageNum = page
  render()
}

// ============================================================
// 搜索和重置
// ============================================================
const onSearch = () => {
  params.value.pageNum = 1
  render()
}

const onReset = () => {
  params.value.pageNum = 1
  searchData.value = {}
  render()
}

// ============================================================
// 弹窗
// ============================================================

/** 打开新增弹窗 */
const handleAdd = async () => {
  dialogVisible.value = true
  title.value = '新增标签'
  await nextTick()
  ruleFormRef.value?.clearValidate('name')
  formModel.value = {}
}

/** 打开编辑弹窗 */
const handleEdit = async (row) => {
  dialogVisible.value = true
  title.value = '编辑标签'
  await nextTick()
  ruleFormRef.value?.clearValidate('name')
  formModel.value = { ...row }
}

// ============================================================
// 保存
// ============================================================

/** 表单提交：根据 formModel.id 判断新增或编辑 */
const confirm = async () => {
  await ruleFormRef.value.validate()
  if (!formModel.value.id) {
    await addApi(formModel.value)
    msg.primary('新增成功')
    params.value.pageNum = 1
  } else {
    await modifyApi(formModel.value)
    msg.primary('修改成功')
  }
  dialogVisible.value = false
  render()
}

// ============================================================
// 删除
// ============================================================
const removeRole = async (id) => {
  await removeApi(id)
  msg.primary('删除成功')
  render()
}

// ============================================================
// 初始化
// ============================================================
render()

// ============================================================
// 导出
// ============================================================
export function useTagList() {
  return {
    searchData, tableData, params, total,
    render,
    onSizeChange, onCurrentChange,
    onSearch, onReset,
    ruleFormRef, dialogVisible, formModel, title, rules,
    handleAdd, handleEdit,
    confirm,
    removeRole,
  }
}
