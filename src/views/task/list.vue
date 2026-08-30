<template>
  <div class="task-container">
    <!-- ==================== 头部工具栏 ==================== -->
    <div class="toolbar">
      <el-button v-perm="'btn.task.add'" size="small" type="primary" icon="Plus" @click="openAddDialog" plain>
        新增任务
      </el-button>
      <el-button v-perm="'btn.task.execute'" size="small" type="info" icon="Refresh" @click="refreshAllTasks" plain>
        刷新所有任务
      </el-button>
    </div>

    <!-- ==================== 任务表格 ==================== -->
    <el-table :data="tableData" style="width: 100%" border>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="taskCode" label="任务编码" width="180" align="center">
        <template #default="{ row }">
          <el-tag type="info" size="small">{{ row.taskCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="taskName" label="任务名称" width="150" align="center" />
      <el-table-column prop="description" label="任务描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="cronExpression" label="Cron表达式" width="180" align="center">
        <template #default="{ row }">
          <el-tag type="primary" size="small">{{ row.cronExpression }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行周期说明" min-width="200" align="center">
        <template #default="{ row }">
            <span style="font-size: 13px; color: var(--el-text-color-primary);">
              {{ translateCron(row.cronExpression) }}
            </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
            {{ row.status === 0 ? '✅ 启用' : '⛔ 禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <!-- ==================== 操作栏 ==================== -->
      <el-table-column v-if="showPermColumn(['btn.task.update', 'btn.task.execute', 'btn.task.remove'])" label="操作" width="350" fixed="right" align="center">
        <template #default="{ row }">
          <!-- 编辑任务 -->
          <el-button v-perm="'btn.task.update'" size="small" type="warning" @click="editTask(row)" plain>编辑</el-button>
          <!-- 立即执行 -->
          <el-button v-perm="'btn.task.execute'" size="small" type="success" @click="executeTask(row)" plain>立即</el-button>
          <!-- 刷新单个任务 -->
          <el-button v-perm="'btn.task.execute'" size="small" type="info" @click="refreshSingleTask(row)" plain>刷新</el-button>
          <!-- 启用/禁用 -->
          <el-button v-perm="'btn.task.execute'" size="small" :type="row.status === 0 ? 'danger' : 'success'" @click="toggleStatus(row)" plain>{{ row.status === 0 ? '禁用' : '启用' }}</el-button>
          <!-- 删除任务(仅禁用状态可删除) -->
          <el-popconfirm
            :title="`确定要删除【${row.taskName}】吗？`"
            confirm-button-text="确定删除"
            cancel-button-text="取消"
            confirm-button-type="danger"
            @confirm="deleteTask(row)"
          >
            <template #reference>
              <el-button size="small" type="danger" v-perm="'btn.task.remove'" :disabled="row.status === 0" plain>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- ==================== 新增/编辑弹窗 ==================== -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" size="small">
        <!-- 任务编码（新增时可编辑，编辑时禁用） -->
        <el-form-item label="任务编码" prop="taskCode">
          <el-input 
            v-model="formData.taskCode" 
            placeholder="请输入任务编码，如: SYNC_COMMENT"
            :disabled="isEditMode"
          />
          <div class="form-hint">⚠️ 任务编码一旦创建不可修改</div>
        </el-form-item>
        
        <!-- 任务名称 -->
        <el-form-item label="任务名称" prop="taskName">
          <el-input 
            v-model="formData.taskName" 
            placeholder="请输入任务名称，如: 评论同步任务"
          />
        </el-form-item>
        
        <!-- 任务描述 -->
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            rows="2"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        
        <!-- Cron表达式 -->
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input 
            v-model="formData.cronExpression" 
            placeholder="请输入Cron表达式，如: 0 0/10 * * * ?"
          />
          <div class="cron-hint">
            <span class="hint-label">常用表达式：</span>
            <el-button link type="primary" @click="setCron('0 0/5 * * * ?')">每5分钟</el-button>
            <el-button link type="primary" @click="setCron('0 0/10 * * * ?')">每10分钟</el-button>
            <el-button link type="primary" @click="setCron('0 0/15 * * * ?')">每15分钟</el-button>
            <el-button link type="primary" @click="setCron('0 0/30 * * * ?')">每30分钟</el-button>
            <el-button link type="primary" @click="setCron('0 0 0/1 * * ?')">每小时</el-button>
            <el-button link type="primary" @click="setCron('0 0 2 * * ?')">每天凌晨2点</el-button>
          
            <div class="test-hint">
              <span class="hint-label">测试表达式：</span>
              <el-button link type="warning" @click="setCron('0/5 * * * * ?')">每5秒</el-button>
              <el-button link type="warning" @click="setCron('0/10 * * * * ?')">每10秒</el-button>
              <el-button link type="warning" @click="setCron('0/15 * * * * ?')">每15秒</el-button>
              <el-button link type="warning" @click="setCron('0/30 * * * * ?')">每30秒</el-button>
              <el-button link type="warning" @click="setCron('0 0/1 * * * ?')">每1分钟</el-button>
            </div>
          </div>
        </el-form-item>
        
        <!-- 任务状态 -->
        <el-form-item label="任务状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="0">✅ 启用</el-radio>
            <el-radio :label="1">⛔ 禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button size="small" type="info" @click="dialogVisible = false" plain>取消</el-button>
        <el-button size="small" type="primary" @click="submitTask" plain>
          {{ isEditMode ? '确认更新' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import msg from '@/components/msg'
import { showPermColumn } from '@/utils/permissions'
import { listApi, addApi, updateApi, executeApi, refreshAllApi, refreshTaskApi, deleteApi } from '@/api/sysTask'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN'

// ==================== 表格数据 ====================
const tableData = ref([])

// ==================== 弹窗相关 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditMode = ref(false)  // true=编辑模式，false=新增模式
const formRef = ref(null)
const formData = ref({
  id: null,
  taskCode: '',
  taskName: '',
  description: '',
  cronExpression: '',
  status: 0  // 0=启用，1=禁用
})

// ==================== 表单验证规则 ====================
const formRules = {
  taskCode: [
    { required: true, message: '请输入任务编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '任务编码只能包含大写字母、数字和下划线，且以字母开头', trigger: 'blur' }
  ],
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: '请输入Cron表达式', trigger: 'blur' }
  ]
}

// ==================== 加载任务列表 ====================
const loadTaskList = async () => {
  try {
    const res = await listApi()
    tableData.value = res.data || res
    console.log('任务列表加载成功:', tableData.value)
  } catch (error) {
    msg.error('加载任务列表失败')
    console.error(error)
  }
}

// ==================== 打开新增弹窗 ====================
const openAddDialog = async() => {
  isEditMode.value = false
  dialogVisible.value = true
  dialogTitle.value = '新增定时任务'
  // 等待对话框渲染完成
  await nextTick()
  formRef.value?.resetFields()
  formData.value = {
    id: null,
    taskCode: '',
    taskName: '',
    description: '',
    cronExpression: '',
    status: 0
  }
}

// ==================== 编辑任务 ====================
const editTask = async(row) => {
  isEditMode.value = true
  dialogVisible.value = true
  dialogTitle.value = `编辑任务 - ${row.taskName}`
  // 等待对话框渲染完成
  await nextTick()
  // 重置表单校验状态
  formRef.value?.resetFields()
  formData.value = { ...row }
}

// ==================== 提交任务（新增/更新） ====================
const submitTask = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (isEditMode.value) {
        // ==================== 编辑模式：全字段更新 ====================
        const updateData = {
          taskName: formData.value.taskName,
          description: formData.value.description,
          cronExpression: formData.value.cronExpression,
          status: formData.value.status
        }
        await updateApi(formData.value.id, updateData)
        msg.primary('任务更新成功，定时任务已自动刷新')
      } else {
        // ==================== 新增模式 ====================
        await addApi(formData.value)
        msg.primary('任务新增成功')
      }
      
      dialogVisible.value = false
      await loadTaskList()
    } catch (error) {
      msg.error('操作失败：' + (error.message || '未知错误'))
      console.error(error)
    }
  })
}

// ==================== 立即执行任务 ====================
const executeTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要立即执行【${row.taskName}】吗？`,
      '🚀 执行确认',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    msg.primary(`【${row.taskName}】已开始执行`)
    await executeApi(row.taskCode)
  } catch (error) {
    if (error !== 'cancel') {
      msg.error('执行失败：' + (error.message || '未知错误'))
    }
  }
}

// ==================== 刷新单个任务 ====================
const refreshSingleTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要刷新【${row.taskName}】的定时配置吗？`,
      '🔄 刷新确认',
      {
        confirmButtonText: '确定刷新',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await refreshTaskApi(row.taskCode)
    msg.primary(`【${row.taskName}】定时配置已刷新`)
    await loadTaskList()
  } catch (error) {
    if (error !== 'cancel') {
      msg.error('刷新失败：' + (error.message || '未知错误'))
    }
  }
}

// ==================== 刷新所有任务 ====================
const refreshAllTasks = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要刷新所有定时任务吗？这将重新加载数据库中的配置。',
      '🔄 刷新确认',
      {
        confirmButtonText: '确定刷新',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await refreshAllApi()
    msg.primary('所有定时任务已刷新')
    await loadTaskList()
  } catch (error) {
    if (error !== 'cancel') {
      msg.error('刷新失败：' + (error.message || '未知错误'))
    }
  }
}

// ==================== 切换任务状态 ====================
const toggleStatus = async (row) => {
  const newStatus = row.status === 0 ? 1 : 0
  const action = newStatus === 0 ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}【${row.taskName}】吗？`,
      `${action}确认`,
      {
        confirmButtonText: `确定${action}`,
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const updateData = {
      taskName: row.taskName,
      description: row.description,
      cronExpression: row.cronExpression,
      status: newStatus
    }
    await updateApi(row.id, updateData)
    
    msg.primary(`任务已${action}`)
    await loadTaskList()
  } catch (error) {
    if (error !== 'cancel') {
      msg.error(`${action}失败：` + (error.message || '未知错误'))
    }
  }
}

const deleteTask = async (row) => {
  try {
    await deleteApi(row.id)
    msg.primary(`已删除任务【${row.taskName}】`)
    await loadTaskList()
  } catch (error) {
    msg.error('删除失败：' + (error.message || '未知错误'))
    console.error(error)
  }
}

// ==================== 快速设置Cron表达式 ====================
const setCron = (cronValue) => {
  formData.value.cronExpression = cronValue
  msg.primary(`已设置为：${cronValue}`)
}

// ==================== Cron表达式翻译 ====================
const translateCron = (cronExpression) => {
  if (!cronExpression) return '未设置'
  try {
    // 1. 获取中文翻译
    let result = cronstrue.toString(cronExpression, { 
      locale: 'zh_CN'
    })
    
    // 2. 提取翻译中的小时数字（1-12点）
    // 匹配 "上午 XX:XX" 或 "上午 XX点" 格式，提取小时数
    const hourMatch = result.match(/上午\s*(\d{1,2})/)
    
    if (hourMatch) {
      const hour = parseInt(hourMatch[1])
      // 3. 判断是否为凌晨时段（1:00 - 5:59）
      if (hour >= 1 && hour <= 5) {
        result = result.replace(/上午/g, '凌晨')
      }
      // 6:00 - 11:59 保持 "上午" 不变
      // 12:00 以后不会有"上午"（cronstrue 会用"下午"）
    }
    
    return result
  } catch (error) {
    console.warn('Cron翻译失败:', cronExpression, error)
    return '无效表达式'
  }
}

// ==================== 页面加载 ====================
onMounted(() => {
  loadTaskList()
})
</script>

<style scoped lang="scss">
.task-container {
  padding: 20px;
  
  .toolbar {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-start;
    gap: 12px;
  }
  
  .cron-hint {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    
    .hint-label {
      margin-right: 8px;
    }
    
    .el-button {
      margin-left: 4px;
      font-size: 12px;
    }

    .test-hint {
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px dashed #e4e7ed;
    }
  }
  
  .form-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #e6a23c;
  }
}
</style>