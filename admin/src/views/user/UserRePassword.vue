<template>
  <div class="change-password-container">
    <el-card class="password-card">
      <template #header>
        <div>
          <span class="title">修改密码</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-width="120px"
        class="password-form"
        status-icon
        size="small"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="formModel.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="formModel.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            :prefix-icon="Lock"
          />
          <div class="password-tips">
            <el-text type="info" size="small">
              密码长度8-20位，包含字母、数字和特殊字符
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formModel.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <!-- 密码强度提示 -->
        <el-form-item label="密码强度" v-if="formModel.newPassword">
          <div class="password-strength">
            <el-progress
              :percentage="passwordStrength.percentage"
              :status="passwordStrength.status"
              :show-text="false"
              style="width: 200px;"
            />
            <el-text :type="passwordStrength.color" size="small">
              {{ passwordStrength.text }}
            </el-text>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="loading"
            size="small"
            plain
          >
            确认修改
          </el-button>
          <el-button type="info" @click="handleReset" size="small" plain>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import msg from '@/components/msg'
import { Lock } from '@element-plus/icons-vue'
import { userUpdatePwdApi } from '@/api/admin'
import { useTokenStore } from '@/store/token'
import { useRouter } from 'vue-router'
const tokenStore = useTokenStore()
// const router = useRouter()

// 响应式数据
const formRef = ref()
const loading = ref(false)

const formModel = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码强度计算
const passwordStrength = computed(() => {
  const password = formModel.newPassword
  if (!password) {
    return { percentage: 0, text: '未输入', status: undefined, color: 'info' }
  }

  let strength = 0
  let tips = []

  // 长度检查
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 10

  // 字符类型检查
  if (/[a-z]/.test(password)) strength += 15
  if (/[A-Z]/.test(password)) strength += 15
  if (/[0-9]/.test(password)) strength += 15
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20

  // 限制最大强度
  strength = Math.min(strength, 100)

  // 根据强度返回状态
  if (strength < 40) {
    return { percentage: strength, text: '弱', status: 'exception', color: 'danger' }
  } else if (strength < 70) {
    return { percentage: strength, text: '中', status: 'warning', color: 'warning' }
  } else {
    return { percentage: strength, text: '强', status: 'success', color: 'success' }
  }
})

// 自定义验证规则
// 旧密码校验
const validateOldPassword = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请输入原密码'))
  }
  if (value.length < 4) {
    return callback(new Error('原密码长度不能少于4位'))
  }
  callback()
}

// 新密码校验
const validateNewPassword = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请输入新密码'))
  }
  if (value.length < 4) {
    return callback(new Error('密码长度不能少于4位'))
  }
  if (value.length > 15) {
    return callback(new Error('密码长度不能超过15位'))
  }
  if (!/^\S{4,15}$/.test(value)) {
    return callback(new Error('密码必须是 4-15位 的非空字符'))
  }
  if (value === formModel.oldPassword) {
    return callback(new Error('新密码不能与原密码相同'))
  }
  callback()
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请再次输入密码'))
  }
  if (value !== formModel.newPassword) {
    return callback(new Error('两次输入的密码不一致'))
  }
  callback()
}

// 表单验证规则
const rules = reactive({
  oldPassword: [
    { required: true, validator: validateOldPassword, trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

// 处理方法
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()
    
    // 确认对话框
    await ElMessageBox.confirm(
      '确定要修改密码吗？修改后需要重新登录。',
      '修改密码确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true

    // 模拟API调用
    // await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里应该是实际的API调用
    // await changePasswordApi({
    //   oldPassword: formModel.oldPassword,
    //   newPassword: formModel.newPassword
    // })

    await userUpdatePwdApi(formModel)

    msg.primary('密码修改成功，请重新登录')
    
    // 清空表单
    handleReset()

    // 清除用户记住密码凭证
    tokenStore.clearCredentials()
    
    // 这里可以触发重新登录逻辑
    // await userStore.logout()
    // router.push('/login')
    
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
      msg.info('已取消修改')
    } /* else {
      // 表单验证失败或其他错误
      msg.error(error.message || '密码修改失败，请检查输入')
    } */
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
  // 手动清空数据，确保响应式更新
  Object.assign(formModel, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}
</script>

<style scoped>
.change-password-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.password-card {
  margin-bottom: 20px;
}

.card-header .title {
  font-size: 15px;
  font-weight: 600;
}

.password-form {
  margin-top: 20px;
}

.password-tips {
  margin-left: 5px;
  margin-top: 8px;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
}

.security-tips {
  color: #bbb;
  font-size: 12px;
  line-height: 1.8;
  padding-left: 16px;
}

.security-tips li {
  margin-bottom: 8px;
}

.tips-card {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .change-password-container {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .password-form :deep(.el-form-item__label) {
    width: 100px !important;
  }
}

/* 自定义输入框样式 */
:deep(.el-input) {
  max-width: 300px;
}
</style>