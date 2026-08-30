<template>
    <v-dialog persistent no-click-animation :width="handleWidth" v-model="dialogVisible" content-class="rounded-8">
        <template #default>
            <div class="dialog-container" :style="{ '--login-scale': handleFontScale }">
                <v-btn
                    icon
                    color="primary"
                    active="primary"
                    variant="text"
                    size="0"
                    class="dialog-close-btn"
                    @click="dialogVisible = false"
                >
                    <v-icon size="30">mdi-close-circle</v-icon>
                </v-btn>
                <v-window v-model="step"
                >
                    <!-- 登录视图 -->
                    <v-window-item :value="1">
                        <v-card title height="auto"  :class="`d-flex flex-column ${handlePadding}`">
                            <v-container class="d-flex align-center">
                                <h2>登录</h2>
                                <span class="text-caption ml-auto">
                                    没有账号?
                                    <a class="text-decoration-none" href="#" @click="switchToRegister">点击注册</a>
                                </span>
                            </v-container>
                            <v-container class="pb-2">
                            <v-form 
                            ref="loginFormRef" 
                            @submit.prevent="handleLogin"
                            >
                                <!-- 账号文本框 -->
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    v-model="loginModel.username"
                                    label="账号 / 邮箱 / 手机号"
                                    placeholder="请输入账号 / 邮箱 / 手机号"
                                    :rules="loginRules.username"
                                    prepend-inner-icon="mdi-account"
                                    class="mb-2"
                                ></v-text-field>        
                                <!-- 密码文本框 -->
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    class="mb-4"
                                    v-model="loginModel.password"
                                    :append-inner-icon="loginShowPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="eyeLoginPwd"
                                    :type="loginShowPassword ? 'text' : 'password'"
                                    label="密码"
                                    placeholder="请输入密码"
                                    :rules="loginRules.password"
                                    :prepend-inner-icon="loginShowPassword ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"
                                    >
                                </v-text-field>

                                <!-- 条款与协议 -->
                                <!-- <v-checkbox
                                color="primary"
                                density="compact"
                                style="--v-input-control-height: 20px; --v-input-padding-top: 8px;"
                                class="my-4" 
                                v-model="loginTerm"
                                :rules="loginRules.term"
                                >
                                    <template #label>
                                        <span class="text-caption text-grey-darken-1">
                                            同意本网站的
                                            <a class="text-primary text-decoration-none" href="#" @click.stop.prevent="handleOpenTerms('terms')">《服务条款》</a>
                                            和
                                            <a class="text-primary text-decoration-none" href="#" @click.stop.prevent="handleOpenTerms('policy')">《隐私协议》</a>
                                        </span>
                                    </template> 
                                </v-checkbox> -->

                                <v-btn 
                                block 
                                color="primary" 
                                :loading="loading"
                                type="submit"
                                >登录</v-btn>
                                <v-container class="text-center">
                                    <a href="#" class="text-decoration-none text-caption text-grey" @click.prevent="switchToForgot">忘记密码</a>
                                </v-container>
                                </v-form>
                            </v-container>
                            <!-- 其他登录方式 -->
                            <v-container class="mt-auto pt-0" v-if="configStore.getUserOtherLoginEnabled()">
                                <v-sheet class="mb-4">
                                    <v-divider color="primary" opacity=".7" gradient><span class="text-caption text-grey" style="flex-shrink: 0;">其他的登录方式</span></v-divider>
                                </v-sheet>
                                
                                <!-- 图标 -->
                                <v-sheet class="text-center py-0">
                                    <v-btn
                                    icon
                                    size="small"
                                    v-for="(item, index) in chats" :key="item.id"
                                    :color="item.color ? item.color : ''"
                                    :to="item.to"
                                    :class="{'ml-8':(index != 0)}"
                                    >
                                    <v-icon>{{ item.icon }}</v-icon> 
                                    </v-btn>        
                                </v-sheet>
                            </v-container>
                        </v-card> 
                    </v-window-item>

                    <!-- 注册视图 -->
                    <v-window-item :value="2">
                        <v-card title height="auto" :class="`d-flex flex-column ${handlePadding}`">
                            <v-container class="d-flex align-center">
                                <h2>注册</h2>
                                <span class="text-caption ml-auto">
                                    已有账号?
                                    <a class="text-decoration-none" href="#" @click="switchToLogin">点击登录</a>
                                </span>
                            </v-container>
                            <v-container>
                            <v-form
                            ref="registerFormRef" 
                            @submit.prevent="handleRegister"
                            >
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    v-model="registerModel.username"
                                    label="用户名"
                                    placeholder="请输入用户名"
                                    :rules="registerRules.username"
                                    prepend-inner-icon="mdi-account"
                                    class="mb-2"
                                >
                                </v-text-field>
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    v-model="registerModel.password"
                                    :append-inner-icon="registerShowPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="eyeRegisterPwd"
                                    :type="registerShowPassword ? 'text' : 'password'"
                                    label="密码"
                                    placeholder="请输入密码"
                                    :rules="registerRules.password"
                                    :prepend-inner-icon="registerShowPassword ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"
                                    class="mb-2"
                                >
                                </v-text-field>
                                <AppEmailCodeField v-model:email="registerModel.email" v-model:code="registerModel.verifyCode" type="register" />
                                    <!-- 条款与协议 -->
                                <v-checkbox
                                color="primary"
                                density="compact"
                                style="--v-input-control-height: 20px; --v-input-padding-top: 8px;"
                                class="my-4" 
                                v-model="registerTerm"
                                :rules="registerRules.term"
                                >
                                    <template #label>
                                        <span class="text-caption text-grey-darken-1">
                                            同意本网站的
                                            <a class="text-primary text-decoration-none" href="#" @click.stop.prevent="handleOpenTerms('terms')">《服务条款》</a>
                                            和
                                            <a class="text-primary text-decoration-none" href="#" @click.stop.prevent="handleOpenTerms('policy')">《隐私协议》</a>
                                        </span>
                                    </template> 
                                </v-checkbox>
                                
                                <v-btn
                                block 
                                color="primary" 
                                :loading="registerLoading"
                                type="submit"
                                >注册</v-btn>
                            </v-form>
                            </v-container>
                        </v-card> 
                    </v-window-item>
                    <v-window-item :value="3">
                        <v-card title height="auto" class="d-flex align-center">
                            <v-container class="text-center">
                                <v-icon :size="handleIconSize" color="success">mdi-check-circle</v-icon> 
                                <h3 class="mt-4">恭喜你，注册成功</h3>
                                <p class="text-caption text-grey">请前往邮箱，查看账号信息
                                    <a href="#" @click="forwardLogin" class="text-decoration-none">前往登录</a>
                                </p>
                            </v-container>
                        </v-card> 
                    </v-window-item>

                    <!-- 忘记密码视图 -->
                    <v-window-item :value="4">
                        <v-card title height="auto" :class="`d-flex flex-column ${handlePadding}`">
                            <v-container class="d-flex align-center">
                                <h2>忘记密码</h2>
                                <span class="text-caption ml-auto">
                                    想起密码了?
                                    <a class="text-decoration-none" href="#" @click="switchToLogin">返回登录</a>
                                </span>
                            </v-container>
                            <v-container>
                            <v-form
                            ref="forgotFormRef"
                            @submit.prevent="handleForgotNext"
                            >
                                <AppEmailCodeField v-model:email="forgotModel.email" v-model:code="forgotModel.verifyCode" type="forgot" email-placeholder="请输入注册时使用的邮箱" />
                                <v-btn
                                block
                                color="primary"
                                type="submit"
                                class="mt-4"
                                >下一步</v-btn>
                            </v-form>
                            </v-container>
                        </v-card>
                    </v-window-item>

                    <!-- 重置密码视图 -->
                    <v-window-item :value="5">
                        <v-card title height="auto" :class="`d-flex flex-column ${handlePadding}`">
                            <v-container class="d-flex align-center">
                                <h2>重置密码</h2>
                                <span class="text-caption ml-auto">
                                    <a class="text-decoration-none" href="#" @click="step = 4">返回上一步</a>
                                </span>
                            </v-container>
                            <v-container>
                            <v-form
                            ref="resetFormRef"
                            @submit.prevent="handlePasswordReset"
                            >
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    v-model="resetModel.newPassword"
                                    :append-inner-icon="resetShowPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="resetShowPassword = !resetShowPassword"
                                    :type="resetShowPassword ? 'text' : 'password'"
                                    label="新密码"
                                    placeholder="请输入新密码"
                                    :rules="resetRules.newPassword"
                                    :prepend-inner-icon="resetShowPassword ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"
                                    class="mb-2"
                                >
                                </v-text-field>
                                <v-text-field
                                    color="primary"
                                    variant="outlined"
                                    density="compact"
                                    v-model="resetModel.confirmPassword"
                                    :append-inner-icon="resetShowConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="resetShowConfirmPassword = !resetShowConfirmPassword"
                                    :type="resetShowConfirmPassword ? 'text' : 'password'"
                                    label="确认密码"
                                    placeholder="请再次输入新密码"
                                    :rules="resetRules.confirmPassword"
                                    :prepend-inner-icon="resetShowConfirmPassword ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"
                                    class="mb-4"
                                >
                                </v-text-field>
                                <v-btn
                                block
                                color="primary"
                                :loading="resetLoading"
                                type="submit"
                                >确认重置</v-btn>
                            </v-form>
                            </v-container>
                        </v-card>
                    </v-window-item>
                </v-window>
            </div>
        </template>
    </v-dialog>

    <!-- 条款/协议弹窗 -->
    <AppTermsDialog v-model="termsVisible" :title="termsTitle" :content="termsContent" />
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@/store/config';
import AppTermsDialog from '@/components/AppTermsDialog.vue'
import AppEmailCodeField from '@/components/AppEmailCodeField.vue'
import { SERVICE_TERMS, PRIVACY_POLICY } from '@/utils/terms'

const display = useDisplay()

const configStore = useConfigStore()

const dialogVisible = ref(false)

const step = ref(1)

import emitter from '@/utils/event-bus.js'


// ------------------------ 响应式 ------------------------

const handleWidth = computed(()=>{
    if(display.smAndDown.value){
        return '320'
    }else return '500'
})

const handlePadding = computed(()=>{
    return display.mobile.value ? 'pa-5': 'pa-10'
})

// 移动端字号缩放系数（动态 rem 适配）
const handleFontScale = computed(() => (display.mobile.value ? 0.8 : 1))

// 移动端成功页图标大小
const handleIconSize = computed(() => (display.mobile.value ? 54 : 70))

// ------------------------ 全局总线 ------------------------ 

emitter.on('loginDialogVisible',param => {
    if(dialogVisible.value && param === true) return
    dialogVisible.value = param
    if(step.value != 1){
        step.value = 1
    }
})

import { onUnmounted } from 'vue'
import { userLoginApi, userRegisterApi, userPasswordResetApi } from '@/api/user';
import { useUserStore } from '@/store/user';

onUnmounted(() => {
    emitter.off('loginDialogVisible')
})

// ------------------------ 登录相关 ------------------------ 

const loginModel = reactive({})

const loginShowPassword = ref(false)

const loginTerm = ref(false)

const chats = reactive([
    {id:'001',icon:'mdi-qqchat',color:'info',to:''},
    {id:'002',icon:'mdi-wechat',color:'success',to:''},
    {id:'001',icon:'mdi-github',color:'on-primary',to:''},
])

const eyeLoginPwd = () => {
     loginShowPassword.value = !loginShowPassword.value
}

// 获取表单 ref
const loginFormRef = ref(null)
const loading = ref(false)

watch(step,()=>{
    if(step.value != 1){
        Object.assign(loginModel,{username:'',password:''})
    }
})

// 登录表单校验规则（类似 Element Plus 风格）
const loginRules = {
    username: [
        (v) => !!v || '请输入账号/邮箱/手机号',
        (v) => {
            if (!v) return true
            // 校验用户名（4-20位字母数字下划线）
            const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/
            // 校验邮箱
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            // 校验手机号（简单校验11位数字，可根据需要调整）
            const phoneRegex = /^1[3-9]\d{9}$/
            
            if (usernameRegex.test(v)) return true
            if (emailRegex.test(v)) return true
            if (phoneRegex.test(v)) return true
            
            return '请输入正确的账号（4-20位字母/数字/下划线）、邮箱或手机号'
        }
    ],
    password: [
        (v) => !!v || '请输入密码',
        (v) => /^\S{4,15}$/.test(v) || '密码必须是 4-15位 的非空字符'
    ],
    term: [
        (v) => !!v || '请同意本网站的条款与协议'
    ]
}

const userStore = useUserStore()

// 登录处理
const handleLogin = async () => {
    // if (!loginFormRef.value) return

    await loginFormRef.value.validate()
    
    loading.value = true
    try {
        // 再次确认表单校验
        const { valid } = await loginFormRef.value.validate()
        
        if (valid) {
            // 这里调用登录接口
            console.log('登录信息:', loginModel)
            console.log('是否同意条款:', loginTerm.value)
            
            // 登录请求
            const res = await userLoginApi(loginModel)

            userStore.setToken(res.data.token)

            userStore.setUser(res.data.userInfo)

            Object.assign(loginModel,{username:'',password:''})

            dialogVisible.value = false
            
            // 登录成功后的处理
            // dialogVisible.value = false
            // 跳转到首页等
        }
    } catch (error) {
        console.error('登录失败:', error)
    } finally {
        loading.value = false
    }
}

// ------------------------ 注册相关 ------------------------ 

const registerModel = reactive({})

const registerShowPassword = ref(false)

const registerTerm = ref(false)

const eyeRegisterPwd = () => {
    //如果type是password类型，点击就把图标切换到mdi-eye-off

    //否则就把图标切换到mdi-eye

     registerShowPassword.value = !registerShowPassword.value
}

const registerLoading = ref(false)
const registerFormRef = ref(null)

// ========== 注册表单校验规则 ==========
const registerRules = {
    username: [
        (v) => !!v || '请输入用户名',
        (v) => /^[a-zA-Z0-9_]{4,20}$/.test(v) || '用户名必须是 4-20位 的字母、数字或下划线'
    ],
    password: [
        (v) => !!v || '请输入密码',
        (v) => /^\S{4,15}$/.test(v) || '密码必须是 4-15位 的非空字符'
    ],
    term: [
        (v) => !!v || '请同意本网站的条款与协议'
    ]
}

// 注册处理
const handleRegister = async () => {

    registerLoading.value = true
    try {
        const { valid } = await registerFormRef.value.validate()

        if (valid) {
            console.log('注册信息:', registerModel)
            await userRegisterApi(registerModel)
            Object.assign(registerModel, { username: '', password: '', email: '', verifyCode: '' })
            step.value = 3
        }
    } catch (error) {
        console.error('注册失败:', error)
    } finally {
        registerLoading.value = false
    }
}

// ------------------------ 忘记密码相关 ------------------------

const forgotModel = reactive({})

const forgotFormRef = ref(null)

// 切换到忘记密码
const switchToForgot = () => {
    step.value = 4
    loginShowPassword.value = false
    // 清除登录表单的校验状态
    loginFormRef.value?.reset()
}

// 下一步：仅做前端格式校验，验证码随重置密码一次性提交后端校验
const handleForgotNext = async () => {
    const { valid } = await forgotFormRef.value.validate()
    if (valid) {
        step.value = 5
    }
}

// ------------------------ 重置密码相关 ------------------------

const resetModel = reactive({})

const resetFormRef = ref(null)

const resetLoading = ref(false)

const resetShowPassword = ref(false)

const resetShowConfirmPassword = ref(false)

const resetRules = {
    newPassword: [
        (v) => !!v || '请输入新密码',
        (v) => /^\S{4,15}$/.test(v) || '密码必须是 4-15位 的非空字符'
    ],
    confirmPassword: [
        (v) => !!v || '请再次输入新密码',
        (v) => v === resetModel.newPassword || '两次输入的密码不一致'
    ]
}

// 重置密码提交
const handlePasswordReset = async () => {
    const { valid } = await resetFormRef.value.validate()
    if (!valid) return

    resetLoading.value = true
    try {
        await userPasswordResetApi({
            email: forgotModel.email,
            verifyCode: forgotModel.verifyCode,
            newPassword: resetModel.newPassword,
            confirmPassword: resetModel.confirmPassword
        })
        window.$snackbar?.success('密码重置成功，请使用新密码登录')
        switchToLogin()
    } catch (error) {
        console.error('重置密码失败:', error)
    } finally {
        resetLoading.value = false
    }
}

// ------------------------ 条款弹窗相关 ------------------------ 

const termsVisible = ref(false)
const termsTitle = ref('')
const termsContent = ref('')

const handleOpenTerms = (type) => {
    termsTitle.value = type === 'terms' ? '服务条款' : '隐私协议'
    termsContent.value = type === 'terms' ? SERVICE_TERMS : PRIVACY_POLICY
    termsVisible.value = true
}

// ------------------------ 切换步骤时重置表单 ------------------------ 

const switchToRegister = () => {
    step.value = 2
    // 重置登录表单
    /* loginModel.username = ''
    loginModel.password = '' */
    loginShowPassword.value = false 
    loginTerm.value = false
    // 清除登录表单的校验状态
    loginFormRef.value?.reset()
}

const switchToLogin = () => {
    step.value = 1
    // 重置注册表单
    /* registerModel.username = ''
    registerModel.password = ''
    registerModel.rePassword = '' */
    registerShowPassword.value = false
    registerTerm.value = false
    // 清除注册表单的校验状态
    registerFormRef.value?.reset()
    // 清除忘记密码/重置密码表单的校验状态
    resetShowPassword.value = false
    resetShowConfirmPassword.value = false
    forgotFormRef.value?.reset()
    resetFormRef.value?.reset()
}

const forwardLogin = () => {
    step.value = 1
    registerShowPassword.value = false
    registerTerm.value = false
    // 清除注册表单的校验状态
    registerFormRef.value?.reset()
}

// 可选：监听 step 变化，当离开注册页时停止倒计时
/* watch(step, (newVal) => {
    if (newVal !== 2) {
        stopCountdown()
    }
}) */

</script>

<style lang="scss" scoped>
.dialog-container {
    position: relative;
    
    .dialog-close-btn {
        position: absolute;
        top: 20px;
        right: 40px;
        z-index: 100;
        /* &:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.05);
        } */
    }
}

:deep(.v-window-item) {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

:deep(.v-window-item:not(.v-window-item--active)) {
    opacity: 0;
    transform: scale(0.95);
}

:deep(.v-window-item--active) {
    opacity: 1;
    transform: scale(1);
}

.dialog-container {
    --login-scale: 1;

    h2 {
        font-size: calc(1.5rem * var(--login-scale)) !important;
    }

    h3 {
        font-size: calc(1.25rem * var(--login-scale)) !important;
    }

    .text-caption {
        font-size: calc(0.75rem * var(--login-scale)) !important;
    }

    // 表单整块缩放：input 经 font:inherit 继承、图标经 em 等比缩放
    :deep(.v-field) {
        font-size: calc(1rem * var(--login-scale)) !important;
    }

    // 浮动 label 固定 1rem，需单独命中（未聚焦时它看起来就是"占位符"）
    :deep(.v-field .v-label) {
        font-size: calc(1rem * var(--login-scale)) !important;
    }

    // 登录/注册/验证码按钮字号（Vuetify 经 --v-btn-size 控制）
    :deep(.v-btn) {
        --v-btn-size: calc(0.875rem * var(--login-scale)) !important;
    }
}
</style>