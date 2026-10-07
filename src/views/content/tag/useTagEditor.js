/**
 * 标签管理共享弹窗逻辑 — TagTable / TagCard / TagCloud 三视图与 list.vue 共用
 *
 * 仅负责新增/编辑弹窗与增删改操作；列表数据由 useTagTable / useTagScroll 各自管理，
 * 增删改成功后通过 registerReload 注册的回调刷新当前激活视图的列表。
 */
import { nextTick, ref } from 'vue'
import { addApi, modifyApi, removeApi } from '@/api/contag'
import msg from '@/components/msg'

// ============================================================
// 弹窗状态（模块级单例，与 list.vue 共享）
// ============================================================
const dialogVisible = ref(false)
const title = ref('')
const formModel = ref({})
const ruleFormRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

// 增删改成功后刷新列表的回调，由当前激活视图的列表 composable 注册
let reloadList = null

/** 注册列表刷新回调（useTagTable / useTagScroll 在 setup 时调用） */
const registerReload = (fn) => { reloadList = fn }

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
// 保存 / 删除
// ============================================================

/** 表单提交：根据 formModel.id 判断新增或编辑 */
const confirm = async () => {
  await ruleFormRef.value.validate()
  if (!formModel.value.id) {
    await addApi(formModel.value)
    msg.primary('新增成功')
  } else {
    await modifyApi(formModel.value)
    msg.primary('修改成功')
  }
  dialogVisible.value = false
  reloadList?.()
}

/** 删除标签 */
const removeRole = async (id) => {
  await removeApi(id)
  msg.primary('删除成功')
  reloadList?.()
}

// ============================================================
// 导出
// ============================================================
export function useTagEditor() {
  return {
    dialogVisible, title, formModel, ruleFormRef, rules,
    handleAdd, handleEdit, confirm, removeRole,
    registerReload,
  }
}
