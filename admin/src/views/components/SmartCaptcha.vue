<template>
    <div class="smart-captcha" :class="{ 'is-verified': verified }">
        <!-- ===== 文本验证码（算术/中文/英文/数字/混合/GIF） ===== -->
        <template v-if="isTextType">
            <div class="captcha-text-row">
                <div class="captcha-text-img-box" v-loading="!backgroundLoaded">
                    <img
                        v-if="vo.backgroundImage"
                        :src="vo.backgroundImage"
                        class="captcha-text-img"
                        alt="验证码"
                        title="点击刷新"
                        @load="backgroundLoaded = true"
                        @click="generate"
                    >
                </div>
                <el-button v-if="backgroundLoaded" text circle size="small" icon="Refresh" @click="generate" :disabled="verified"></el-button>
            </div>
            <el-form ref="answerFormRef" :model="answerModel" :rules="answerRules" @submit.prevent>
                <el-form-item prop="answer">
                    <el-input
                        v-model="answerModel.answer"
                        placeholder="请输入验证码"
                        clearable
                        :maxlength="answerMaxLength"
                        :disabled="verified"
                    >
                        <template #prefix><el-icon><Key /></el-icon></template>
                    </el-input>
                </el-form-item>
            </el-form>
        </template>

        <!-- ===== 点选验证码 ===== -->
        <template v-else-if="isClickType">
            <div class="captcha-click-box" v-loading="!backgroundLoaded">
                <div ref="boxRef" class="captcha-click-bg">
                    <img
                        v-if="vo.backgroundImage"
                        :src="vo.backgroundImage"
                        class="captcha-click-bg-img"
                        :style="{ height: vo.backgroundImageHeight * scale + 'px' }"
                        alt="点选背景"
                        @load="backgroundLoaded = true"
                        @click="onClickCaptcha"
                    >
                    <span
                        v-for="(p, i) in clickPoints"
                        :key="i"
                        class="captcha-click-dot"
                        :style="{ left: p.x * scale + 'px', top: p.y * scale + 'px' }"
                    >{{ i + 1 }}</span>
                </div>
                <img v-if="vo.templateImage && backgroundLoaded" :src="vo.templateImage" class="captcha-tip-img" alt="点选提示">
                <el-button v-if="backgroundLoaded" text circle size="small" class="captcha-click-refresh" icon="Refresh" @click="generate"></el-button>
                <div v-if="backgroundLoaded" class="captcha-click-hint">请在图中依次点击提示文字（{{ clickPoints.length }}/{{ CLICK_COUNT }}）</div>
            </div>
        </template>

        <!-- ===== 滑块验证码 ===== -->
        <template v-else>
            <div ref="boxRef" class="captcha-slider-box" v-loading="!backgroundLoaded">
                <img
                    v-if="vo.backgroundImage"
                    :src="vo.backgroundImage"
                    class="captcha-bg"
                    :style="{ height: vo.backgroundImageHeight * scale + 'px' }"
                    alt="滑块背景"
                    @load="backgroundLoaded = true"
                >
                <div v-if="!vo.backgroundImage" class="captcha-bg-placeholder"></div>
                <img
                    v-if="vo.templateImage"
                    :src="vo.templateImage"
                    class="captcha-piece"
                    draggable="false"
                    :style="{ left: pieceX + 'px', width: vo.templateImageWidth * scale + 'px', height: vo.templateImageHeight * scale + 'px' }"
                    alt="滑块"
                >
                <el-button
                    v-if="backgroundLoaded"
                    text
                    circle
                    size="small"
                    class="captcha-refresh"
                    icon="Refresh"
                    @click="generate"
                ></el-button>
                <!-- 底部滑块轨道 -->
                <div v-if="backgroundLoaded" class="captcha-slider-track">
                    <div class="captcha-slider-fill" :style="{ width: fillWidth + 'px' }"></div>
                    <span class="captcha-slider-hint" :class="{ 'is-success': verified }">
                        {{ verified ? '验证成功!' : (isDragging ? '' : '拖动滑块完成拼图') }}
                    </span>
                    <div class="captcha-slider-btn" :style="{ left: btnLeft + 'px' }" @pointerdown="onPointerDown">
                        <el-icon><Right /></el-icon>
                    </div>
                </div>
            </div>
        </template>

        <!-- ===== 验证通过遮罩（文本/点选类型） ===== -->
        <div v-if="verified && !isSliderType" class="captcha-success">
            <el-icon color="#67c23a" :size="20"><SuccessFilled /></el-icon>
            <span>验证通过</span>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useEventListener, useElementSize } from '@vueuse/core'
import { Key, SuccessFilled } from '@element-plus/icons-vue'
import { captchaGenerateApi, captchaVerifyApi } from '@/api/captcha'

// ============================================================
// 数据
// ============================================================

const props = defineProps({
    type: {
        type: String,
        default: 'slider'
    }
})

const TEXT_TYPES = ['default', 'chinese', 'english', 'number', 'mixed', 'gif']
const isTextType = computed(() => TEXT_TYPES.includes(props.type))
const isClickType = computed(() => props.type === 'click')
const isSliderType = computed(() => !isTextType.value && !isClickType.value)

// 点选验证码需要点击的字符数（对应后端 StandardWordClickImageCaptchaGenerator.checkClickCount 默认值）
const CLICK_COUNT = 4

const vo = reactive({
    id: '',
    type: '',
    backgroundImage: '',
    templateImage: '',
    backgroundImageWidth: 0,
    backgroundImageHeight: 0,
    templateImageWidth: 0,
    templateImageHeight: 0
})

const verifying = ref(false)
const verified = ref(false)
// 校验通过后签发的一次性 verifyToken（提交登录 / 注册时消费）
const verifyToken = ref('')
// 背景图加载状态：generate 时置 false，背景图 onload 置 true（驱动 v-loading 与行为类交互显隐）
const backgroundLoaded = ref(false)

// ============================================================
// 展示缩放（背景图按容器宽度等比缩放，轨迹/点选坐标换算回自然像素）
// ============================================================

const boxRef = ref(null)
const { width: boxWidth } = useElementSize(boxRef)
const scale = computed(() => (vo.backgroundImageWidth && boxWidth.value ? boxWidth.value / vo.backgroundImageWidth : 1))

// ============================================================
// 滑块：拖拽 + 轨迹采集
// ============================================================

const maxDrag = computed(() => Math.max(0, boxWidth.value - vo.templateImageWidth * scale.value))
const dragX = ref(0)
const isDragging = ref(false)
const trackList = ref([])
const dragStartTime = ref(0)

// 底部滑块轨道：按钮在轨道内拖动，拼图块按比例联动到 maxDrag
const btnWidth = 40
const maxHandleDrag = computed(() => Math.max(0, boxWidth.value - btnWidth))
const pieceX = computed(() => (maxHandleDrag.value && maxDrag.value ? (dragX.value * maxDrag.value) / maxHandleDrag.value : 0))
const fillWidth = computed(() => (verified.value ? boxWidth.value : dragX.value + btnWidth))
const btnLeft = computed(() => (verified.value ? maxHandleDrag.value : dragX.value))

let startClientX = 0
let lastSampleAt = 0

const onPointerDown = (e) => {
    if (verified.value) return
    isDragging.value = true
    startClientX = e.clientX
    dragStartTime.value = Date.now()
    trackList.value = [{ x: 0, y: 0, t: 0 }]
    lastSampleAt = 0
}

const onPointerMove = (e) => {
    if (!isDragging.value) return
    dragX.value = Math.max(0, Math.min(e.clientX - startClientX, maxHandleDrag.value))
    const t = Date.now() - dragStartTime.value
    if (t - lastSampleAt < 8) return
    lastSampleAt = t
    trackList.value.push({ x: Math.round(pieceX.value / scale.value), y: 0, t })
}

const onPointerUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
    const t = Date.now() - dragStartTime.value
    trackList.value.push({ x: Math.round(pieceX.value / scale.value), y: 0, t })
    if (trackList.value.length > 1) handleSliderVerify()
}

useEventListener(window, 'pointermove', onPointerMove)
useEventListener(window, 'pointerup', onPointerUp)

// ============================================================
// 点选：点击采集
// ============================================================

const clickPoints = ref([])

const onClickCaptcha = (e) => {
    if (verified.value || clickPoints.value.length >= CLICK_COUNT) return
    const naturalX = Math.round(e.offsetX / scale.value)
    const naturalY = Math.round(e.offsetY / scale.value)
    clickPoints.value.push({ x: naturalX, y: naturalY })
    if (clickPoints.value.length >= CLICK_COUNT) {
        handleClickVerify()
    }
}

// ============================================================
// 生成
// ============================================================

const generate = async () => {
    verified.value = false
    verifying.value = true
    backgroundLoaded.value = false
    try {
        const res = await captchaGenerateApi(props.type)
        if (res.code === 200 && res.data) {
            Object.assign(vo, res.data)
        }
        dragX.value = 0
        trackList.value = []
        clickPoints.value = []
        verifyToken.value = ''
    } catch (e) {
        console.error('生成验证码失败:', e)
        // 失败时保留旧图：恢复已加载状态，避免 loading 卡住
        backgroundLoaded.value = true
    } finally {
        verifying.value = false
    }
}

onMounted(() => {
    generate()
})

// ============================================================
// 校验
// ============================================================

const answerModel = reactive({ answer: '' })
const answerFormRef = ref(null)
// 文本答案最多 6 位，长度交给注册 / 登录接口拦截
const answerMaxLength = 6

// 低代码校验规则（el-form 内置，仅必填）
const answerRules = { answer: [{ required: true, message: '请输入验证码', trigger: 'blur' }] }

// 对外暴露：提交登录 / 注册前调用，返回一次性 verifyToken；失败抛错（阻止提交）
const verify = async () => {
    // 已通过验证则复用缓存 token，避免重复后端校验（答案 key 校验成功后已删，重试会误报过期）
    if (verifyToken.value) return verifyToken.value
    // 行为类：未完成动作则拦截
    if (!isTextType.value) {
        throw new Error('请先完成验证码验证')
    }
    // 文本类：先触发 el-form 前端校验（必填）
    try {
        await answerFormRef.value.validate()
    } catch (e) {
        throw new Error('请输入正确的验证码')
    }
    const v = (answerModel.answer || '').trim()
    verifying.value = true
    try {
        const res = await captchaVerifyApi({ id: vo.id, type: props.type, answer: v })
        verifyToken.value = res.data
        verified.value = true
        return res.data
    } catch (e) {
        // 后端校验失败：清空答案 + 刷新，提示交由拦截器
        answerModel.answer = ''
        verifyToken.value = ''
        generate()
        throw e
    } finally {
        verifying.value = false
    }
}
defineExpose({ verify })

const handleSliderVerify = async () => {
    verifying.value = true
    try {
        const track = {
            bgImageWidth: vo.backgroundImageWidth,
            bgImageHeight: vo.backgroundImageHeight,
            templateImageWidth: vo.templateImageWidth,
            templateImageHeight: vo.templateImageHeight,
            startTime: dragStartTime.value,
            stopTime: Date.now(),
            trackList: trackList.value
        }
        const res = await captchaVerifyApi({ id: vo.id, type: props.type, track })
        if (res.code === 200 && res.data) {
            verified.value = true
            verifyToken.value = res.data
        }
    } catch (e) {
        generate()
    } finally {
        verifying.value = false
    }
}

const handleClickVerify = async () => {
    verifying.value = true
    try {
        const track = {
            bgImageWidth: vo.backgroundImageWidth,
            bgImageHeight: vo.backgroundImageHeight,
            templateImageWidth: vo.templateImageWidth,
            templateImageHeight: vo.templateImageHeight,
            startTime: Date.now(),
            stopTime: Date.now(),
            trackList: clickPoints.value.map((p) => ({ x: p.x, y: p.y, t: 0, type: 'CLICK' }))
        }
        const res = await captchaVerifyApi({ id: vo.id, type: props.type, track })
        if (res.code === 200 && res.data) {
            verified.value = true
            verifyToken.value = res.data
        }
    } catch (e) {
        clickPoints.value = []
        generate()
    } finally {
        verifying.value = false
    }
}
</script>

<style lang="scss" scoped>
.smart-captcha {
    position: relative;
    width: 100%;

    .captcha-text-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 10px;

        .captcha-text-img-box {
            min-width: 100px;
            min-height: 40px;
            display: flex;
            align-items: center;
            border-radius: 4px;
            overflow: hidden;
        }

        .captcha-text-img {
            height: 40px;
            cursor: pointer;
            border-radius: 4px;
        }
    }

    .captcha-slider-box {
        position: relative;
        width: 100%;
        min-height: 90px;
        overflow: hidden;
        border-radius: 4px;

        .captcha-bg {
            width: 100%;
            display: block;
        }

        .captcha-bg-placeholder {
            width: 100%;
            aspect-ratio: 600 / 240;
        }

        .captcha-piece {
            position: absolute;
            top: 0;
            left: 0;
            cursor: grab;
            touch-action: none;
            user-select: none;
        }

        .captcha-refresh {
            position: absolute;
            top: 2px;
            right: 2px;
            z-index: 10;
        }

        .captcha-slider-track {
            position: relative;
            width: 100%;
            height: 40px;
            margin-top: 6px;
            background: var(--el-fill-color-light);
            border-radius: 4px;
            overflow: hidden;

            .captcha-slider-fill {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                background: var(--el-color-success-light-8);
                z-index: 1;
            }

            .captcha-slider-hint {
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: var(--el-text-color-secondary);
                pointer-events: none;
                z-index: 2;

                &.is-success {
                    justify-content: flex-start;
                    padding-left: 12px;
                    color: var(--el-color-success);
                    font-weight: 500;
                }
            }

            .captcha-slider-btn {
                position: absolute;
                top: 0;
                left: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                background: #fff;
                border: 1px solid var(--el-border-color);
                border-radius: 4px;
                color: var(--el-color-success);
                cursor: grab;
                touch-action: none;
                user-select: none;
                z-index: 3;

                &:active {
                    cursor: grabbing;
                }
            }
        }
    }

    .captcha-click-box {
        position: relative;
        width: 100%;

        .captcha-tip-img {
            display: block;
            height: 28px;
            margin-top: 4px;
        }

        .captcha-click-bg {
            position: relative;
            width: 100%;
            aspect-ratio: 600 / 240;
            cursor: pointer;

            .captcha-click-bg-img {
                width: 100%;
                display: block;
            }

            .captcha-click-dot {
                position: absolute;
                width: 18px;
                height: 18px;
                line-height: 18px;
                margin-left: -9px;
                margin-top: -9px;
                text-align: center;
                font-size: 12px;
                color: #fff;
                background: var(--el-color-primary);
                border-radius: 50%;
                pointer-events: none;
            }
        }

        .captcha-click-refresh {
            position: absolute;
            top: 2px;
            right: 2px;
            z-index: 10;
        }

        .captcha-click-hint {
            margin-top: 4px;
            font-size: 11px;
            color: var(--el-text-color-regular);
        }
    }

    .captcha-success {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.75);
        font-size: 14px;
        color: #67c23a;
        z-index: 20;
        border-radius: 4px;
        pointer-events: none;
    }

    // 加载态：浅白背景降低不透明度 + spinner 尺寸缩小（改 CSS 变量，尺寸与垂直居中同时生效）
    :deep(.el-loading-mask) {
        background-color: rgba(255, 255, 255, 0.8);
    }
    :deep(.el-loading-spinner) {
        --el-loading-spinner-size: 24px;
    }
}
</style>
