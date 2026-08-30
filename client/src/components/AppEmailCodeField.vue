<template>
    <div>
        <!-- ===== 邮箱输入 ===== -->
        <v-text-field
            ref="emailFieldRef"
            color="primary"
            variant="outlined"
            density="compact"
            :model-value="email"
            @update:model-value="emit('update:email', $event)"
            label="邮箱"
            :placeholder="emailPlaceholder"
            :rules="emailRules"
            prepend-inner-icon="mdi-email"
            class="mb-2"
            name="email"
            :disabled="emailDisabled"
        >
        </v-text-field>

        <!-- ===== 验证码输入 + 发送按钮 ===== -->
        <v-row  style="margin-bottom: -20px;">
            <v-col :cols="!display.mobile.value ? 8 : 7">
                <v-text-field
                color="primary"
                variant="outlined"
                density="compact"
                :model-value="code"
                @update:model-value="emit('update:code', $event)"
                label="验证码"
                placeholder="请输入验证码"
                :rules="codeRules"
                prepend-inner-icon="mdi-email"
                name="verifyCode"
                >
                </v-text-field>
            </v-col>
            <v-col :cols="!display.mobile.value ? 4 : 5">
                <v-btn block color="primary" :disabled="countdown > 0 || isSending"
                @click="handleSendCode"
                >
                    <span v-if="countdown > 0">{{ countdown }}秒后重试</span>
                    <span v-else>获取验证码</span>
                </v-btn>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { emailCodeSendApi } from '@/api/email'

// ============================================================
// 数据
// ============================================================

// v-model 双向绑定（经典 props + emits 写法）
const props = defineProps({
    email: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    // 禁用邮箱输入框（注销等场景：邮箱锁定为当前账号邮箱）
    emailDisabled: {
        type: Boolean,
        default: false
    },
    emailPlaceholder: {
        type: String,
        default: '请输入邮箱'
    },
    // 验证码类型：register-注册, forgot-忘记密码
    type: {
        type: String,
        default: 'register'
    }
})

const emit = defineEmits(['update:email', 'update:code'])

const display = useDisplay()

// 邮箱输入框 ref（发送前只校验邮箱这一个字段）
const emailFieldRef = ref(null)

// 倒计时秒数 / 发送中标记
const countdown = ref(0)  // 倒计时秒数
const isSending = ref(false)  // 是否正在发送验证码
let countdownTimer = null  // 倒计时定时器引用，onUnmounted 清理

// 组件卸载时清理定时器，防止内存泄漏
onUnmounted(() => {
    if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
    }
})

// ============================================================
// 表单校验
// ============================================================

const emailRules = [
    (v) => !!v || '请输入邮箱',
    (v) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v) || '邮箱格式不正确'
]

const codeRules = [
    (v) => !!v || '请输入验证码',
    (v) => /^\d{6}$/.test(v) || '验证码必须是6位数字'
]

// ============================================================
// 发送验证码
// ============================================================

/**
 * 发送验证码：只校验邮箱字段，成功后启动 60 秒倒计时
 */
const handleSendCode = async () => {
    // 直接调字段级 validate（Vuetify 输入框暴露 validate()），无需经过外层表单
    const errors = await emailFieldRef.value.validate()
    if (errors.length > 0) {
        return
    }

    isSending.value = true

    try {
        // 调用发送验证码的接口
        await emailCodeSendApi({ email: props.email, type: props.type })

        // 发送成功后启动倒计时
        countdown.value = 60
        countdownTimer = setInterval(() => {
            if (countdown.value <= 1) {
                clearInterval(countdownTimer)
                countdownTimer = null
                countdown.value = 0
                isSending.value = false
            } else {
                countdown.value--
            }
        }, 1000)

    } catch (error) {
        console.error('发送验证码失败:', error)
        countdown.value = 0
        isSending.value = false
    }
}
</script>
