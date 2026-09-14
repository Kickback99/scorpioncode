<template>
  <v-sheet class="pa-6">
    <v-form ref="profileFormRef">
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="warning"
          variant="outlined"
          size="small"
          @click="showChangePasswordDialog = true"
        >
          <v-icon left size="18">mdi-lock-reset</v-icon>
          修改密码
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          class="ml-2"
          @click="openCancelDialog"
        >
          <v-icon left size="18">mdi-account-remove</v-icon>
          注销账号
        </v-btn>
      </div>

      <!-- 头像 -->
      <v-row>
        <v-col cols="12" class="text-center">
          <div class="avatar-wrapper mb-4">
            <v-avatar :size="display.mobile.value ? 65 : 100" color="grey-lighten-2">
              <!-- 使用预览URL或默认头像 -->
              <v-img v-if="avatarPreview || profileData.avatar" :src="avatarPreview || profileData.avatar"></v-img>
              <v-icon v-else size="60" color="grey">mdi-account-circle</v-icon>
              <!-- 使用 v-file-input 触发文件选择 -->
              <v-file-input
                ref="fileInputRef"
                v-model="profileData.avatar"
                accept="image/jpeg,image/jpg,image/png"
                density="compact"
                variant="plain"
                class="edit-avatar-btn"
                prepend-icon="mdi-camera"
                hide-details
                @update:model-value="handleFileChange"
                hide-input
              ></v-file-input>
            </v-avatar>
            <!-- <v-btn
              icon
              size="small"
              color="primary"
              class="edit-avatar-btn"
              @click="changeAvatar"
            >
              <v-icon size="18">mdi-camera</v-icon>
            </v-btn> -->
          </div>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="triggerFileInput"
          >
            更换头像
          </v-btn>
        </v-col>
      </v-row>

      <!-- 用户名（禁用状态） -->
      <v-text-field
        v-model="profileData.username"
        label="用户名"
        disabled
        variant="outlined"
        density="comfortable"
        class="mb-3"
      ></v-text-field>

      <!-- 昵称 -->
      <v-text-field
        v-model="profileData.nickname"
        label="昵称"
        placeholder="请输入昵称"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        :rules="[v => !!v || '昵称不能为空']"
      ></v-text-field>

      <!-- 手机号 -->
      <v-text-field
        v-model="profileData.phone"
        label="手机号"
        placeholder="请输入手机号"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        :rules="[
          v => !v || /^1[3-9]\d{9}$/.test(v) || '请输入正确的手机号'
        ]"
      ></v-text-field>

      <!-- 邮箱（只读） -->
      <v-text-field
        v-model="profileData.email"
        label="邮箱"
        disabled
        variant="outlined"
        density="comfortable"
        class="mb-3"
      ></v-text-field>

      <!-- 操作按钮 -->
      <div class="d-flex justify-center mt-6">
        <v-btn
          color="primary"
          :loading="saving"
          @click="saveProfile"
        >
          <v-icon left>mdi-content-save</v-icon>
          保存
        </v-btn>
      </div>
    </v-form>

    <!-- 修改密码弹窗 -->
    <v-dialog v-model="showChangePasswordDialog" max-width="500">
      <v-card :style="{ '--dialog-scale': scale }">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          修改密码
          <v-btn icon variant="text" @click="showChangePasswordDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <v-form ref="passwordFormRef">
            <v-text-field
              v-model="passwordData.oldPassword"
              label="原密码"
              type="password"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || '请输入原密码']"
              class="mb-3"
            ></v-text-field>
            <v-text-field
              v-model="passwordData.newPassword"
              label="新密码"
              type="password"
              variant="outlined"
              density="comfortable"
              :rules="[
                v => !!v || '请输入新密码',
                v => v.length >= 6 || '密码长度至少6位'
              ]"
              class="mb-3"
            ></v-text-field>
            <v-text-field
              v-model="passwordData.confirmPassword"
              label="确认新密码"
              type="password"
              variant="outlined"
              density="comfortable"
              :rules="[
                v => !!v || '请确认新密码',
                v => v === passwordData.newPassword || '两次输入的密码不一致'
              ]"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showChangePasswordDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="changingPassword" @click="changePassword">确认修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 注销账号弹窗 -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card :style="{ '--dialog-scale': scale }">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          注销账号
          <v-btn icon variant="text" @click="showCancelDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            注销后账号将被删除且无法恢复
          </v-alert>
          <v-form ref="cancelFormRef">
            <AppEmailCodeField
              v-model:email="cancelData.email"
              v-model:code="cancelData.verifyCode"
              type="cancel"
              email-disabled
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showCancelDialog = false">取消</v-btn>
          <v-btn color="error" :loading="cancelling" @click="cancelAccount">确认注销</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useDisplay } from 'vuetify'
import { useDialogFontScale } from '@/composables/useDialogFontScale'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { userUpdateInfoApi, userCancelApi, userChangePasswordApi } from '@/api/user'
import AppEmailCodeField from '@/components/AppEmailCodeField.vue'
import { useWebSocket } from '@/server/useWebSocket.js'

// 定义事件
const emit = defineEmits(['profile-saved'])

const userStore = useUserStore()

const display = useDisplay()
const scale = useDialogFontScale()

// 关闭 WebSocket（修改密码/注销后断开连接，与 Header 的 handleLogout 保持一致）
const { closeWebSocket } = useWebSocket()

// 个人资料数据
const profileData = reactive({
  username: userStore.user?.username || 'test_user',
  nickname: userStore.user?.nickname || '测试用户',
  phone: userStore.user?.phone || '',
  email: userStore.user?.email || 'test@example.com',
  avatar: userStore.user?.avatar || ''
})

const profileFormRef = ref(null)
const saving = ref(false)

// 文件相关
const fileInputRef = ref(null)
const avatarPreview = ref(null) // 头像预览URL

// 修改密码
const showChangePasswordDialog = ref(false)
const passwordData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref(null)
const changingPassword = ref(false)

// 文件校验
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!allowedTypes.includes(file.type)) {
    window.$snackbar?.error('必须为 jpg | png | jpeg 格式')
    return false
  }
  if (!isLt2M) {
    window.$snackbar?.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理文件选择
const handleFileChange = (file) => {
  if (!file) return

  // 校验文件
  if (!validateFile(file)) {
    return
  }

  // 创建预览
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
  }
  avatarPreview.value = URL.createObjectURL(file)
  profileData.avatar = file
}

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const saveProfile = async () => {
  const { valid } = await profileFormRef.value.validate()
  if (!valid) return
  
  saving.value = true
  try {

    // console.log('保存个人资料:', profileData)

    // 调用更新接口
    await userUpdateInfoApi(profileData)

    // 回显
    await userStore.getUser()

    // 这里是错误的，因为后端 userUpdateInfoApi 没有返回值
    // 调用更新接口
    /* const res = await userUpdateInfoApi(profileData)
    profileData.avatar = res.data?.avatar || profileData.avatar // 使用服务器返回的头像URL
    // 更新 store
    userStore.setUser({ ...userStore.user, ...profileData }) */
    
    // 触发父组件事件
    emit('profile-saved', profileData)
    window.$snackbar?.success('修改成功')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  
  changingPassword.value = true
  try {
    await userChangePasswordApi({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    })
    showChangePasswordDialog.value = false
    // 重置表单
    Object.assign(passwordData, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    // 后端已删除登录态，强制重新登录
    closeWebSocket()
    userStore.clearUserStore()
    window.$snackbar?.success('密码修改成功，请重新登录')
    router.push('/')
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    changingPassword.value = false
  }
}

// ------------------------ 注销账号 ------------------------

const router = useRouter()

const showCancelDialog = ref(false)
const cancelFormRef = ref(null)
const cancelling = ref(false)
const cancelData = reactive({
  email: '',
  verifyCode: ''
})

const openCancelDialog = () => {
  // 邮箱锁定为当前账号邮箱
  cancelData.email = userStore.user?.email || ''
  cancelData.verifyCode = ''
  showCancelDialog.value = true
}

const cancelAccount = async () => {
  const { valid } = await cancelFormRef.value.validate()
  if (!valid) return

  cancelling.value = true
  try {
    await userCancelApi({ verifyCode: cancelData.verifyCode })
    showCancelDialog.value = false
    // 清空本地登录态并跳回首页
    closeWebSocket()
    userStore.clearUserStore()
    router.push('/')
    window.$snackbar?.success('账号已注销，感谢使用')
  } catch (error) {
    console.error('注销账号失败:', error)
  } finally {
    cancelling.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  loadProfile: () => {
    // 重新加载用户数据
    Object.assign(profileData, {
      username: userStore.user?.username || 'test_user',
      nickname: userStore.user?.nickname || '测试用户',
      phone: userStore.user?.phone || '',
      email: userStore.user?.email || 'test@example.com',
      avatar: userStore.user?.avatar || ''
    })
  }
})
</script>

<style scoped lang="scss">
.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.edit-avatar-btn {
  position: absolute;
  bottom: -2px;
  right: 10px;
  width: 32px !important;
  min-width: 32px !important;
  border-radius: 50% !important;
  // background-color: white !important;
  // box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

// ============================================================
// 移动端弹窗字号缩放
// ============================================================
.v-card {
  --dialog-scale: 1;

  :deep(.text-h6) {
    font-size: calc(1.25rem * var(--dialog-scale)) !important;
  }

  :deep(.v-field) {
    font-size: calc(1rem * var(--dialog-scale)) !important;
  }

  :deep(.v-field .v-label) {
    font-size: calc(1rem * var(--dialog-scale)) !important;
  }

  :deep(.v-btn) {
    --v-btn-size: calc(0.875rem * var(--dialog-scale)) !important;
  }

  :deep(.v-alert) {
    font-size: calc(0.875rem * var(--dialog-scale)) !important;
  }
}
</style>