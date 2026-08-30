<template>
  <div class="user-profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span class="title">个人信息</span>
          <el-button
            size="small" 
            type="primary" 
            icon="Edit" 
            @click="editMode = !editMode"
            plain
          >
            {{ editMode ? '取消编辑' : '编辑资料' }}
          </el-button>
        </div>
      </template>

      <!-- 用户信息展示/编辑 -->
      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-upload">
            <el-avatar 
              :size="100" 
              :src="imgUrl || avatar" 
              class="user-avatar"
            />
            <el-upload
              v-if="editMode"
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              name="avatar"
              :onChange="handleSelectAvatar"
            >
              <el-button type="primary" icon="Upload" size="small" plain>
                更换头像
              </el-button>
            </el-upload>
          </div>
        </div>

        <!-- 基本信息表单 -->
        <el-form 
          :model="userInfo" 
          :rules="rules" 
          ref="formRef"
          label-width="100px"
          class="info-form"
          size="small"
        >
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="用户名">
                <el-input 
                  v-model="userInfo.username" 
                  :disabled="true"
                  placeholder="请输入用户名"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12">
              <el-form-item label="呢称" prop="nickname">
                <el-input 
                  v-model="userInfo.nickname" 
                  :disabled="!editMode"
                  placeholder="请输入呢称"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="邮箱" prop="email">
                <el-input 
                  v-model="userInfo.email" 
                  :disabled="!editMode"
                  placeholder="请输入邮箱"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="手机号" prop="phone">
                <el-input 
                  v-model="userInfo.phone" 
                  :disabled="!editMode"
                  placeholder="请输入手机号"
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="个人简介">
                <el-input
                  v-model="userInfo.bio"
                  type="textarea"
                  :rows="3"
                  :disabled="!editMode"
                  placeholder="写点关于你自己的介绍吧～"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="editMode">
          <el-button type="info" @click="handleCancel" size="small" plain>取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="loading" size="small" plain>
            保存修改
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 其他信息卡片 -->
    <el-row :gutter="20" class="additional-info">
      <el-col :xs="24" :sm="12">
        <el-card>
          <template #header>
              <span style="font-size: 15px;">账号信息</span>
          </template>
          <div class="info-list">
            <div class="info-item">
              <span class="label">注册时间：</span>
              <span class="value">{{ profileStats.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后登录：</span>
              <span class="value">{{ profileStats.lastLogin }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户角色：</span>
                <div class="role-tags">
                <el-tag 
                  v-for="(role, index) in userStore.roleNames" 
                  :key="index"
                  type="success"
                  size="default"
                  class="role-tag"
                >
                  {{ role }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-card>
          <template #header>
            <span style="font-size: 15px;">系统信息</span>
          </template>
          <div class="info-list">
            <div class="info-item">
              <span class="label">登录次数：</span>
              <span class="value">{{ profileStats.loginCount }} 次次</span>
            </div>
            <div class="info-item">
              <span class="label">账号状态：</span>
              <el-tag :type="profileStats.status === 0 ? 'success' : 'danger'">
                {{ profileStats.status === 0 ? '正常' : '禁用' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted} from 'vue'
import { useUserStore } from '@/store/user'
import avatar from '@/assets/images/avatar-circle.png'
import { userInfoApi, userStatsApi, userUpdateInfoApi } from '@/api/admin'
import msg from '@/components/msg'
// 响应式数据
const editMode = ref(false)
const loading = ref(false)
const formRef = ref()
const imgUrl = ref('')
const userStore = useUserStore()

// 用户信息数据（写死的数据）
const userInfo = reactive({
  ...userStore.userInfo  
})

// 统计数据用本地 ref（不与 store 混合）
const profileStats = ref({
    createTime: '',
    status: 0,
    lastLogin: '',
    loginCount: 0
})


// 备份原始数据用于取消编辑时恢复
const originalUserInfo = ref({})

// 表单验证规则
const rules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入呢称', trigger: 'blur' }
  ]
})

// 方法定义
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!allowedTypes.includes(file.type)) {
    msg.error('必须为 jpg | png | jpeg 格式')
    return false
  }
  if (!isLt2M) {
    msg.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleSelectAvatar = (file) => {

    // 先进行校验
    if (!validateFile(file.raw)) {
      return // 校验失败，不继续执行
    }

    imgUrl.value = URL.createObjectURL(file.raw)
    userInfo.avatar = file.raw

}

/**
 * 获取用户统计数据
 */
const fetchProfileStats = async () => {
    try {
        const res = await userStatsApi()
        if (res.code === 200) {
            profileStats.value = {
                createTime: res.data.createTime,
                status: res.data.status !== undefined ? res.data.status : 0,
                lastLogin: res.data.lastLogin,
                loginCount: res.data.loginCount
            }
        }
    } catch (error) {
        console.error('获取统计数据失败:', error)
        // 静默失败，不影响主流程
    }
}

const handleSave = async () => {
  console.log(userInfo === userStore.userInfo)
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    // await modifyApi(userInfo)
    // 更新备份数据
    // Object.assign(originalUserInfo.value, { ...userInfo })
    // 发送请求
    await userUpdateInfoApi(userInfo)
    const res = await userInfoApi()
    Object.assign(userStore.userInfo, res.data.userInfo) 
    editMode.value = false
    loading.value = false
    msg.primary('个人信息更新成功')
  } catch (error) {
    loading.value = false
    
    // 区分错误类型
    if (error?.fields) {
      // 表单验证失败
      msg.error('请完善表单信息')
    } else {
      // API请求失败
      console.error('API请求错误:', error)
      msg.error('保存失败，请重试')
    }
  }
}

const handleCancel = () => {
  // 恢复原始数据
  Object.assign(userInfo, { ...originalUserInfo.value })
  editMode.value = false
  msg.info('已取消编辑')
  imgUrl.value = originalUserInfo.value.avatar
}

// 初始化备份数据
onMounted(async() => {
  Object.assign(originalUserInfo.value, { ...userInfo })
  imgUrl.value = originalUserInfo.value.avatar

   // 获取统计数据
  await fetchProfileStats()
})
</script>

<style scoped>
.user-profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);  /* 🔥 新增颜色 */
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 30px;
  text-align: center;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

/* .user-avatar {
  border: 3px solid #f0f0f0;
} */

.info-form {
  width: 100%;
  max-width: 800px;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.additional-info {
  margin-top: 20px;
  font-size: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.info-item .value {
  color: var(--el-text-color-regular);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile-container {
    padding: 10px;
  }
  
  .profile-content {
    align-items: stretch;
  }
  
  .avatar-upload {
    flex-direction: column;
  }
}
</style>