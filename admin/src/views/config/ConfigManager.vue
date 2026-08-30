<template>
  <div class="config-management" :class="userConfigStore.isDarkEnabled ? 'dark-mode' : 'light-mode'">
    <div class="header-actions">
      <div class="header-left">
        <el-button text size="small" @click="handleToggleExpand">
          <el-icon><component :is="tableExpanded ? 'Fold' : 'Expand'" /></el-icon> {{ tableExpanded ? '全部折叠' : '全部展开' }}
        </el-button>
        <el-button v-perm="'btn.config.add'" type="primary" @click="handleAddRoot" size="small" plain>
          <el-icon><Plus /></el-icon>
          新增配置
        </el-button>
        <el-button type="info" @click="handleReset" size="small" plain>
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button v-if="filterKeyword" type="warning" size="small" plain @click="handleClearFilter">
          <el-icon><Close /></el-icon>
          清除筛选
        </el-button>
      </div>
      <SmartConfigSearch @select="handleConfigSelect" />
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      border
      stripe
      class="config-table"
      max-height="calc(100vh - 260px)"
    >
      <el-table-column prop="key" label="配置项" min-width="220">
        <template #default="{ row }">
          <span class="config-key">
            <el-icon v-if="row.icon" class="object-icon"><component :is="row.icon" /></el-icon>
            <el-icon v-else-if="row.isObject" class="object-icon"><Folder /></el-icon>
            <el-icon v-else class="field-icon"><Document /></el-icon>
            {{ row.displayKey }}
            <el-tag v-if="row.isSystem" type="danger" size="small" effect="plain" style="margin-left: 2px">系统</el-tag>
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="label" label="标签" width="160">
        <template #default="{ row }">
          <span v-if="row.label" :class="{ 'text-muted': row.isObject }">{{ row.label }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="desc" label="说明" min-width="160">
        <template #default="{ row }">
          <span v-if="row.desc" class="text-muted">{{ row.desc }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>

      <el-table-column v-if="false" prop="options" label="可选值" width="160">
        <template #default="{ row }">
          <span v-if="getOptionsHint(row.key)" class="text-muted">{{ getOptionsHint(row.key) }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>

      <el-table-column prop="value" label="值" min-width="200">
        <template #default="{ row }">
          <template v-if="row.isEditing">
            <!-- 编辑模式 -->
            <el-input
              v-if="row.type === 'string'"
              v-model="row.editValue"
              :placeholder="getPlaceholder(row.key)"
              size="small"
              style="width: 100%"
            />
            <el-input-number
              v-else-if="row.type === 'number'"
              v-model="row.editValue"
              :min="row.min !== undefined ? row.min : -Infinity"
              :max="row.max !== undefined ? row.max : Infinity"
              size="small"
              style="width: 100%"
            />
            <el-switch
              v-else-if="row.type === 'boolean'"
              v-model="row.editValue"
              size="small"
            />
            <el-input
              v-else
              v-model="row.editValue"
              size="small"
              style="width: 100%"
            />
          </template>
          <template v-else>
            <!-- 展示模式 -->
            <span v-if="row.isObject" class="object-value">对象</span>
            <el-switch
              v-else-if="row.type === 'boolean'"
              v-model="row.value"
              disabled
              size="small"
            />
            <el-tag v-else-if="row.type === 'number'" type="info" size="small">
              {{ row.value }}
            </el-tag>
            <span v-else>{{ row.value }}</span>
          </template>
        </template>
      </el-table-column>

      <el-table-column v-if="showPermColumn(['btn.config.update', 'btn.config.remove', 'btn.config.add'])" label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.isEditing">
            <el-button type="primary" link size="small" @click="handleSave(row)">
              <el-icon><Check /></el-icon> 保存
            </el-button>
            <el-button type="info" link size="small" @click="handleCancel(row)">
              <el-icon><Close /></el-icon> 取消
            </el-button>
          </template>
          <template v-else>
            <el-button type="warning" link size="small" plain @click="handleEdit(row)" v-perm="'btn.config.update'" :disabled="row.isObject || row.readonly">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <!-- 删除按钮：对象有子节点 或 系统预设配置 时禁用 -->
            <el-button type="danger" link size="small" plain @click="handleDelete(row)" v-perm="'btn.config.remove'" :disabled="(row.isObject && hasChildren(row)) || row.isSystem">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
            <el-button v-perm="'btn.config.add'" type="primary" link size="small" plain @click="handleAddChild(row)" v-if="row.isObject">
              <el-icon><Plus /></el-icon> 新增子项
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增配置对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增配置"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="auto" size="small">
        <el-form-item label="配置项名称" prop="key">
          <el-input
            v-model="addForm.key"
            placeholder="请输入配置项名称（如：newConfig）"
          />
          <div class="form-tip">支持字母、数字、下划线，不能以数字开头</div>
        </el-form-item>
        <el-form-item label="配置项类型" prop="type">
          <el-radio-group v-model="addForm.type">
            <el-radio value="string">字符串</el-radio>
            <el-radio value="number">数字</el-radio>
            <el-radio value="boolean">布尔值</el-radio>
            <el-radio value="object">对象</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认值" v-if="addForm.type !== 'object'">
          <el-input
            v-if="addForm.type === 'string'"
            v-model="addForm.value"
            placeholder="请输入默认值"
          />
          <el-input-number
            v-else-if="addForm.type === 'number'"
            v-model="addForm.value"
          :min="addForm.min !== null ? addForm.min : undefined"
          :max="addForm.max !== null ? addForm.max : undefined"
          />
          <el-switch v-else-if="addForm.type === 'boolean'" v-model="addForm.value" size="small"/>
        </el-form-item>
        
        <!-- 阈值设置开关 -->
        <el-form-item v-if="addForm.type === 'number'">
          <el-checkbox v-model="addForm.enableThreshold">
            设置数值范围限制
          </el-checkbox>
          <div class="form-tip">不设置则使用系统默认配置</div>
        </el-form-item>
        
        <!-- 阈值设置区域（仅在开启时显示） -->
        <template v-if="addForm.type === 'number' && addForm.enableThreshold">
          <el-form-item label="最小值">
            <el-input-number 
              v-model="addForm.min" 
              :min="-Infinity" 
              :max="addForm.max !== null ? addForm.max : Infinity"
            />
          </el-form-item>
          <el-form-item label="最大值">
            <el-input-number 
              v-model="addForm.max" 
              :min="addForm.min !== null ? addForm.min : -Infinity"
              :max="Infinity"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button size="small" type="info" @click="addDialogVisible = false" plain>取消</el-button>
        <el-button size="small" type="primary" @click="handleConfirmAdd" plain>确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import msg from '@/components/msg'
import { showPermColumn } from '@/utils/permissions'
import { Plus, Edit, Delete, Check, Close, Document, Folder, RefreshRight } from '@element-plus/icons-vue'
import SmartConfigSearch from '@/views/components/SmartConfigSearch.vue'
import { useConfigStore } from '@/store/config'
import { useUserConfigStore } from '@/store/userConfig'
import { updateAllConfigApi, getConfigApi, updateConfigValueApi, deleteConfigValueApi } from '@/api/config'

const configStore = useConfigStore()
const userConfigStore = useUserConfigStore()

// 表格数据
const tableData = ref([])
const tableRef = ref(null)
const fullTableData = ref([]) // 全量数据备份，搜索过滤时不变
const filterKeyword = ref('')
const addDialogVisible = ref(false)
const addFormRef = ref(null)

// 新增表单
const addForm = reactive({
  key: '',
  type: 'string',
  value: '',
  min: null,           // 默认为 null，表示不设置
  max: null,           // 默认为 null，表示不设置
  enableThreshold: false,  // 是否启用阈值设置
  parentPath: ''
})

// 表单验证规则
const addRules = {
  key: [
    { required: true, message: '请输入配置项名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '配置项名称必须以字母或下划线开头，只能包含字母、数字、下划线', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

let nextId = 100

// 检查是否为系统预设配置（使用 store 的 isSystemConfig 方法）
const isSystemField = (key) => {
  return configStore.isSystemConfig(key)
}

// 获取字段的最小值限制（统一从 numberLimits 读取）
const getFieldMin = (key) => {
  const limit = configStore.getLimitMin(key)
  return limit !== undefined ? limit : -Infinity
}

// 获取字段的最大值限制（统一从 numberLimits 读取）
const getFieldMax = (key) => {
  const limit = configStore.getLimitMax(key)
  return limit !== undefined ? limit : Infinity
}

// 顶层嵌套对象排序 — 与 configItems.js 前台分组顺序对齐
const TOP_LEVEL_ORDER = [
  'comment', 'nav', 'user', 'profile',
  'article_detail', 'article_list', 'notification',
  'user_config', 'oss', 'person', 'logo',
]

// 从 configItems.js 提取 desc 映射
import { useConfigItems } from './configItems'
const CONFIG_DESC_MAP = {}
const buildDescMap = () => {
  if (Object.keys(CONFIG_DESC_MAP).length) return
  const { groups } = useConfigItems()
  for (const g of groups) {
    for (const it of (g.items || [])) {
      CONFIG_DESC_MAP[it.key] = { label: it.label, desc: it.desc, icon: it.icon, readonly: it.readonly }
    }
  }
}

// configKey → options value 列表（radio 型配置项的 placeholder）
const OPTION_HINTS = {}
const buildOptionHints = () => {
  if (Object.keys(OPTION_HINTS).length) return
  const { groups } = useConfigItems()
  for (const g of groups) {
    for (const it of (g.items || [])) {
      if (it.type === 'radio' && it.options?.length) {
        OPTION_HINTS[it.key] = it.options.map(o => o.value).join(', ')
      }
    }
  }
}
const getOptionsHint = (configKey) => {
  buildOptionHints()
  return OPTION_HINTS[configKey] || ''
}

const getPlaceholder = (configKey) => getOptionsHint(configKey)

/**
 * 拼接完整 API key（携带 client/admin/user 父路径前缀）
 * row.key 是相对路径（如 'comment.article_comment_enabled'），
 * 通过节点 _groupKey 或 _itemMap 查到所属 group 后拼接为 'client.comment.article_comment_enabled'
 */
const buildApiKey = (row) => {
  const gk = row._groupKey || configStore.getConfigDefinition(row.key)?.group
  return gk ? `${gk}.${row.key}` : row.key
}

/** 获取配置项标签和说明 */
const getConfigMeta = (fullPath) => {
  buildDescMap()
  if (CONFIG_DESC_MAP[fullPath]) return CONFIG_DESC_MAP[fullPath]
  const def = configStore.getConfigDefinition(fullPath)
  return { label: def?.label || '', desc: '' }
}

// 将配置对象转换为树形表格数据（按 configItems.js 顺序排列）
const convertToTreeData = (obj, parentPath = '', _groupKey = '') => {
  const result = []
  const entries = Object.entries(obj)

  if (!parentPath) {
    // 顶层排序：嵌套对象按 TOP_LEVEL_ORDER，标量值排最后
    const getOrder = (key) => {
      const isObj = obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])
      if (isObj) {
        const idx = TOP_LEVEL_ORDER.indexOf(key)
        return idx === -1 ? 999 : idx
      }
      return 1000 // 标量值排最后
    }
    entries.sort((a, b) => getOrder(a[0]) - getOrder(b[0]))
  }

  for (const [key, value] of entries) {
    const fullPath = parentPath ? `${parentPath}.${key}` : key
    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
    const min = getFieldMin(fullPath)
    const max = getFieldMax(fullPath)

    const meta = CONFIG_DESC_MAP[fullPath]
    const node = {
      id: nextId++,
      key: fullPath,
      displayKey: key,
      originalKey: key,
      label: meta?.label || getConfigMeta(fullPath).label,
      desc: meta?.desc || getConfigMeta(fullPath).desc,
      icon: meta?.icon || null,
      value: isObject ? null : value,
      type: isObject ? 'object' : typeof value,
      isObject: isObject,
      isEditing: false,
      editValue: isObject ? null : value,
      children: [],
      parentPath: parentPath,
      min: isFinite(min) ? min : undefined,
      max: isFinite(max) ? max : undefined,
      isSystem: isSystemField(fullPath),
      readonly: meta?.readonly || false,
      _groupKey,
    }

    if (isObject && value !== null) {
      node.children = convertToTreeData(value, fullPath, _groupKey)
    }

    result.push(node)
  }

  return result
}

// 按 configItems 分组包装树形表格数据（API 数据已按 group.key 分组）
const buildGroupedTreeData = (apiData) => {
  const { groups } = useConfigItems()
  buildDescMap()
  const result = []
  const knownGroupKeys = new Set(groups.map(g => g.key))

  // 1. 已知分组（client / admin / user）
  for (const group of groups) {
    const groupData = apiData[group.key]
    if (!groupData || typeof groupData !== 'object') continue

    result.push({
      id: nextId++,
      key: group.key, displayKey: group.label, originalKey: group.key,
      label: '', desc: '', icon: group.icon,
      value: null, type: 'object', isObject: true,
      isEditing: false, editValue: null,
      children: convertToTreeData(groupData, '', group.key),
      parentPath: '', min: undefined, max: undefined, isSystem: false
    })
  }

  // 2. API 中存在但 configItems 未声明的根级 key（如用户新增的 address）
  for (const [key, value] of Object.entries(apiData)) {
    if (knownGroupKeys.has(key)) continue
    if (key === 'loading' || key === 'numberLimits') continue

    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
    result.push({
      id: nextId++,
      key, displayKey: key, originalKey: key,
      label: '', desc: '', icon: null,
      value: isObject ? null : value,
      type: isObject ? 'object' : typeof value,
      isObject,
      isEditing: false,
      editValue: isObject ? null : value,
      children: isObject ? convertToTreeData(value, key, '') : [],
      parentPath: '', min: undefined, max: undefined, isSystem: false,
      _groupKey: '',
    })
  }

  return result
}

// 加载配置数据
const loadConfigData = async () => {
  try {
    const res = await getConfigApi()
    if (res.code === 200 && res.data) {
      nextId = 100
      fullTableData.value = buildGroupedTreeData(res.data)
      tableData.value = fullTableData.value
      filterKeyword.value = ''
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    msg.error('加载配置失败')
  }
}

const handleClearFilter = () => {
  filterKeyword.value = ''
  tableData.value = fullTableData.value
  setTimeout(() => {
    tableData.value.forEach(row => {
      tableRef.value?.toggleRowExpansion(row, false)
    })
  }, 100)
}

// ============================================================
// 展开/折叠
// ============================================================

/** 表格全部展开状态 */
const tableExpanded = ref(false)

/** 展开/折叠切换（递归遍历树形表格行） */
const handleToggleExpand = () => {
  const walk = (rows, expand) => {
    rows.forEach(row => {
      tableRef.value?.toggleRowExpansion(row, expand)
      if (row.children?.length) walk(row.children, expand)
    })
  }
  tableExpanded.value = !tableExpanded.value
  walk(tableData.value, tableExpanded.value)
}

/** 搜索选中配置项 — 过滤表格数据并滚动到目标行 */
const handleConfigSelect = (item) => {
  filterKeyword.value = item.isGroup ? item.groupLabel || item.label : (item.configKey || item.label)

  // 递归检查节点树是否包含关键词
  const nodeContains = (node, kw, rel) => {
    if (node.key.toLowerCase().includes(kw) || node.key.toLowerCase().includes(rel)) return true
    return (node.children || []).some(c => nodeContains(c, kw, rel))
  }

  // 过滤：保留匹配的分组及子节点（支持相对路径和 group 前缀路径）
  let keyword = filterKeyword.value.toLowerCase()
  tableData.value = fullTableData.value
    .map(group => {
      if (item.isGroup && group.key === item.groupKey) return group
      if (keyword && group.children?.length) {
        // 如果 keyword 以 group.key 开头，去掉前缀做相对匹配
        const rel = keyword.startsWith(group.key + '.') ? keyword.slice(group.key.length + 1) : keyword
        const matched = group.children.filter(child => nodeContains(child, keyword, rel))
        if (matched.length) return { ...group, children: matched }
      }
      return null
    })
    .filter(Boolean)

  // 展开所有匹配节点 + 滚动到第一个匹配行
  setTimeout(() => {
    const expandRecursive = (node) => {
      tableRef.value?.toggleRowExpansion(node, true)
      ;(node.children || []).forEach(expandRecursive)
    }
    tableData.value.forEach(row => expandRecursive(row))
    const rows = document.querySelectorAll('.config-table .el-table__row')
    for (const row of rows) {
      if (row.textContent?.includes(item.configKey || item.groupLabel || item.label)) {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' })
        break
      }
    }
  }, 200)
}

// 重置配置
const handleReset = async () => {
  try {
    await ElMessageBox.confirm('重置将放弃所有未保存的修改，确定要重置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await loadConfigData()
    msg.primary('已重置')
  } catch {
    // 取消操作
  }
}

// 编辑配置
const handleEdit = (row) => {
  row.isEditing = true
  row.editValue = cloneValue(row.value)
}

// 克隆值
const cloneValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.parse(JSON.stringify(value))
  }
  return value
}

// 保存配置
const handleSave = async (row) => {
  try {
    // 验证输入值类型
    let newValue = row.editValue
    if (row.type === 'number') {
      newValue = Number(newValue)
      if (isNaN(newValue)) {
        msg.error('请输入有效的数字')
        return
      }

      // 检查数值范围（使用当前的 min/max）
      const currentMin = row.min !== undefined ? row.min : -Infinity
      const currentMax = row.max !== undefined ? row.max : Infinity
      if (newValue < currentMin) {
        msg.error(`值不能小于 ${currentMin}`)
        return
      }
      if (newValue > currentMax) {
        msg.error(`值不能大于 ${currentMax}`)
        return
      }
    } else if (row.type === 'boolean') {
      newValue = row.editValue === true || row.editValue === 'true'
    }
    
    // 调用单个配置更新接口
    const res = await updateConfigValueApi(buildApiKey(row), newValue)
    if (res.code === 200) {
      row.value = cloneValue(newValue)
      row.isEditing = false
      msg.primary('保存成功')
      // 同步更新 store
      await syncStoreValue(row.key, newValue)
    } else {
      msg.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    msg.error('保存失败')
  }
}

// 同步 store 中的值
const syncStoreValue = (key, value) => {
  configStore.setValue(key, value)
  configStore.executeInit()
}

// 取消编辑
const handleCancel = (row) => {
  row.isEditing = false
  row.editValue = cloneValue(row.value)
}

// 判断节点是否有子节点（非空对象）
const hasChildren = (row) => {
  if (!row.isObject) return false
  // 如果 children 数组存在且有内容，返回 true
  return row.children && row.children.length > 0
}

// 删除配置
const handleDelete = async (row) => {

  // 系统预设配置不允许删除（系统预设配置按钮已禁用，此方法不会执行，但保留逻辑）
  if (row.isSystem) {
    msg.warning('系统预设配置不可删除')
    return
  }

  // 检查是否为已定义的配置项（存在于 configItems.js，注入到 _itemMap）
  const isDefined = !!configStore.getConfigDefinition(row.key)

  let confirmMessage = ''
  if (isDefined) {
    confirmMessage = `配置项 "${row.displayKey}" 已在 configItems.js 源码中定义，删除后需同步移除源码定义。确定要删除吗？`
  } else {
    confirmMessage = `确定要删除配置项 "${row.displayKey}" 吗？此操作不可恢复！`
  }


  try {
    await ElMessageBox.confirm(
      confirmMessage,
      '提示',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 如果是数字类型，移除 store 中的限制
    if (row.type === 'number') {
      configStore.removeNumberLimit(row.key)
    }
    
    const res = await deleteConfigValueApi(buildApiKey(row))
    if (res.code === 200) {
      msg.primary('删除成功')
      await configStore.loadConfig()
      await loadConfigData()
    } else {
      msg.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      msg.error('删除失败')
    }
  }
}

// 重置新增表单
const resetAddForm = () => {
  addForm.key = ''
  addForm.type = 'string'
  addForm.value = ''
  addForm.min = null
  addForm.max = null
  addForm.enableThreshold = false
  
  // 清除表单校验状态和错误信息
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
}

// 新增根配置
const handleAddRoot = () => {
  resetAddForm()
  addForm.parentPath = ''
  addDialogVisible.value = true
}

// 新增子配置
const handleAddChild = (row) => {
  resetAddForm()
  addForm.parentPath = row.key
  addDialogVisible.value = true
}

// 确认新增
const handleConfirmAdd = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      try {        
        const fullKey = addForm.parentPath ? `${addForm.parentPath}.${addForm.key}` : addForm.key

        // 检查是否在 CONFIG_DEFINITIONS 中已存在
        /* if (configStore.getConfigDefinition(fullKey)) {
          msg.warning(`配置项 "${addForm.key}" 已在 CONFIG_DEFINITIONS 源码中定义，不能重复添加`)
          return
        } */
        
        const fullConfig = buildFullConfig()
        
        let targetObj = fullConfig
        
        if (addForm.parentPath) {
          let pathParts = addForm.parentPath.split('.')
          targetObj = getNestedObject(fullConfig, pathParts)
          if (!targetObj) {
            // 父路径可能是相对路径（如仅 'address'），尝试在各 group 下查找
            const { groups } = useConfigItems()
            for (const g of groups) {
              const tryParts = [g.key, ...pathParts]
              const found = getNestedObject(fullConfig, tryParts)
              if (found) { targetObj = found; pathParts = tryParts; break }
            }
          }
          if (!targetObj) {
            // 仍不存在则用原始 pathParts 创建
            ensureNestedPath(fullConfig, pathParts)
            targetObj = getNestedObject(fullConfig, pathParts)
          }
        }
        
        // 检查key是否已存在
        if (addForm.key in targetObj) {
          msg.error(`配置项 "${addForm.key}" 已存在`)
          return
        }
        
        // 设置新值
        let value = addForm.value

        if (addForm.type === 'number') {
          value = Number(value)

          // 未勾选阈值开关 → 放行，不保存限制（使用 configItems 源码配置）
          if (addForm.enableThreshold) {
            const minToSave = addForm.min !== null ? addForm.min : undefined
            const maxToSave = addForm.max !== null ? addForm.max : undefined

            // 源码默认阈值校验：该 key 已在 DEFAULT_NUMBER_LIMITS 中定义时，
            // 勾选的阈值必须与源码一致，否则报错
            const def = configStore.getDefaultNumberLimit(fullKey)
            if (def) {
              if (minToSave !== undefined && def.min !== minToSave) {
                msg.error(`最小值与源码定义不一致（源码为 ${def.min}）`)
                return
              }
              if (maxToSave !== undefined && def.max !== maxToSave) {
                msg.error(`最大值与源码定义不一致（源码为 ${def.max}）`)
                return
              }
            }

            if (minToSave !== undefined || maxToSave !== undefined) {
              configStore.setNumberLimit(fullKey, minToSave, maxToSave)
            }
          }
        } else if (addForm.type === 'boolean') {
          value = Boolean(value)
        } else if (addForm.type === 'object') {
          value = {}
        }
        
        targetObj[addForm.key] = value
        
        const res = await updateAllConfigApi(fullConfig)
        if (res.code === 200) {
          msg.primary('新增成功')
          addDialogVisible.value = false
          await configStore.loadConfig()
          await loadConfigData()
        } else {
          msg.error(res.message || '新增失败')
        }
      } catch (error) {
        console.error('新增失败:', error)
        msg.error('新增失败')
      }
    }
  })
}

// 构建完整的配置对象（从当前表格数据）
const buildFullConfig = () => {
  const config = {}
  const data = fullTableData.value.length ? fullTableData.value : tableData.value
  for (const node of data) {
    buildConfigFromNode(config, node)
  }
  return config
}

// 从节点构建配置对象
const buildConfigFromNode = (parent, node) => {
  if (node.isObject) {
    parent[node.originalKey] = {}
    if (node.children) {
      for (const child of node.children) {
        buildConfigFromNode(parent[node.originalKey], child)
      }
    }
  } else {
    parent[node.originalKey] = node.value
  }
}

// 获取嵌套对象
const getNestedObject = (obj, pathParts) => {
  let current = obj
  for (const part of pathParts) {
    if (current[part] === undefined) {
      return null
    }
    current = current[part]
  }
  return current
}

// 确保嵌套路径存在（不覆盖已有值）
const ensureNestedPath = (obj, pathParts) => {
  let current = obj
  for (const part of pathParts) {
    if (current[part] === undefined || current[part] === null) {
      current[part] = {}
    }
    current = current[part]
  }
}

// 更新嵌套值
const updateNestedValue = (obj, pathParts, value) => {
  let current = obj
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (current[pathParts[i]] === undefined) {
      current[pathParts[i]] = {}
    }
    current = current[pathParts[i]]
  }
  current[pathParts[pathParts.length - 1]] = value
}

// 监听配置store变化，同步表格数据
onMounted(() => {
  configStore.initNumberLimits()
  loadConfigData()
})

// 调整默认值使其在范围内
const adjustValueToRange = () => {
  if (addForm.type !== 'number') return
  if (!addForm.enableThreshold) return  // 未启用阈值时，不调整
  
  let currentValue = addForm.value
  let min = addForm.min
  let max = addForm.max
  
  // 注意：min 和 max 可能为 null，需要处理
  if (min !== null && currentValue < min) {
    addForm.value = min
  }
  if (max !== null && currentValue > max) {
    addForm.value = max
  }
}

// 监听 min 变化
watch(() => addForm.min, () => {
  adjustValueToRange()
})

// 监听 max 变化
watch(() => addForm.max, () => {
  adjustValueToRange()
})

// 监听类型变化
watch(() => addForm.type, (newType) => {
    if (newType === 'number') {
    // 重置数值相关字段
    addForm.value = 0
    addForm.min = null
    addForm.max = null
    addForm.enableThreshold = false
    // 未启用阈值，不调整范围
  }else if (newType === 'boolean') {
    addForm.value = true
  } else if (newType === 'string') {
    addForm.value = ''
  }
})

// 监听启用阈值开关变化
watch(() => addForm.enableThreshold, (enabled) => {
  if (!enabled) {
    // 关闭时清空 min/max
    addForm.min = null
    addForm.max = null
  } else {
    // 开启时设置默认值
    if (addForm.min === null) addForm.min = 0
    if (addForm.max === null) addForm.max = 100
    adjustValueToRange()
  }
})
</script>

<style scoped>
.config-management {
  /* padding: 20px; */
  min-height: 100%;
}

.header-actions {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--el-bg-color);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: 12px;
}

.config-table {
  width: 100%;
}

.config-key {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.object-icon {
  color: var(--el-color-primary);
}

.field-icon {
   color: var(--el-color-primary);
}

.object-value {
  color: #909399;
  font-style: italic;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-table__row) {
  cursor: default;
}

:deep(.el-table .cell) {
  line-height: 32px;
}

.dark-mode :deep(.el-table) {
  --el-table-bg-color: #1e1e1e;
  --el-table-tr-bg-color: #1e1e1e;
  --el-table-header-bg-color: #2d2d2d;
  --el-table-row-hover-bg-color: #2d2d2d;
  --el-table-border-color: #3a3a3a;
  color: #e0e0e0;
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.dark-mode :deep(.el-tag--info) {
  background-color: #3a3a3a;
  border-color: #4a4a4a;
  color: #e0e0e0;
}
</style>