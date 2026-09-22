<!-- src/views/components/SmartEmojiPicker.vue -->
<template>
    <!-- ===== 表情选择 ===== -->
    <!-- 用 el-popover：点开后在光标处插入（弹层被传送到 body，不受弹窗滚动容器裁剪） -->
    <el-popover
        v-if="configStore.isCommentReplyEmojiEnabled"
        v-model:visible="popoverOpen"
        :width="288"
        trigger="click"
        :show-arrow="false"
        :popper-options="{ placement: 'bottom-start' }"
        popper-class="sep-popper"
    >
        <template #reference>
            <el-button
                size="small"
                text
                class="sep-trigger"
                title="插入表情"
                aria-label="插入表情"
                @mousedown="handleRememberCaret"
            >
                <i-ant-design-smile-outlined class="sep-trigger-icon" />
            </el-button>
        </template>

        <div class="sep-panel">
            <div class="sep-grid">
                <!-- 静态字符网格用原生 button，246 个 el-button 的组件实例开销不值当；
                     mousedown.prevent 防止点击夺走输入框焦点（对齐 SmartConfigSearch 面板项的做法） -->
                <button
                    v-for="(emoji, i) in EMOJI_LIST"
                    :key="i"
                    type="button"
                    class="sep-cell"
                    @mousedown.prevent
                    @click="handlePick(emoji)"
                >{{ emoji }}</button>
            </div>
        </div>
    </el-popover>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { nextTick, ref } from 'vue'
import { EMOJI_LIST } from '@/utils/emojis'
import msg from '@/components/msg'
import { useConfigStore } from '@/store/config'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

const modelValue = defineModel({ type: String, default: '' })

const props = defineProps({
    /** el-input 实例（实例上暴露了 textarea）或原生 textarea，用于读写光标与 maxlength */
    inputEl: {
        type: Object,
        default: null
    }
})

// 按下按钮那一刻记录的光标位置
const caret = ref(null)

// 面板开关：选中表情后主动收起
const popoverOpen = ref(false)

// el-input 把 textarea 暴露在实例上；原生元素自身带 setSelectionRange
const resolveInput = () => {
    const v = props.inputEl
    if (!v) return null
    if (v.textarea) return v.textarea
    if (typeof v.setSelectionRange === 'function') return v
    return v.$el?.querySelector('textarea') ?? null
}

// ============================================================
// 事件处理
// ============================================================
// 打开面板会让 textarea 失焦，个别输入法失焦会重置 selectionStart，所以在 mousedown 时先记下来
const handleRememberCaret = () => {
    caret.value = resolveInput()?.selectionStart ?? null
}

// 在光标处插入。长度按 UTF-16 码元算，与 el-input 的计数、后端 String.length 口径一致（一个 emoji 占 2）
const handlePick = (emoji) => {
    const el = resolveInput()
    const max = el?.maxLength ?? -1

    // maxlength 只约束用户手输，程序化写入会绕过它，所以这里必须自己拦
    if (max > 0 && modelValue.value.length + emoji.length > max) {
        msg.warning(`最多 ${max} 字`)
        return
    }

    const at = Math.min(caret.value ?? el?.selectionStart ?? modelValue.value.length, modelValue.value.length)
    modelValue.value = modelValue.value.slice(0, at) + emoji + modelValue.value.slice(at)

    caret.value = at + emoji.length
    // 点完是否收起走配置：默认 false（管理端面板不挡视线，保持常驻便于连选）
    if (configStore.isCommentReplyEmojiAutoCloseEnabled) popoverOpen.value = false
    // v-model 回写 value 会把光标顶到末尾，必须等 DOM 更新后再设回去
    nextTick(() => {
        el?.focus()
        el?.setSelectionRange(at + emoji.length, at + emoji.length)
    })
}
</script>

<style scoped lang="scss">
/* ==================== 面板与网格（几何对齐用户端：288px 宽 / 208px 高 / 8 列） ==================== */
.sep-panel {
    padding: 6px;
}

.sep-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    max-height: 208px;
    overflow-y: auto;
}

.sep-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.125rem;
    line-height: 1;
    /* 指定彩色 emoji 字体，避免部分系统用文字字体渲染成单色字形 */
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

.sep-cell:hover {
    background-color: var(--el-fill-color-light);
}

/* ==================== 触发按钮 ==================== */
/* 同排按钮是 size=small（24px），这里靠图标字号对齐观感，不额外抬高度 */
.sep-trigger {
    padding: 0 6px;
}

.sep-trigger-icon {
    font-size: 16px;
}
</style>

<style lang="scss">
/* ==================== 弹层本体（EP 自有元素，须用非 scoped 块） ==================== */
/* 去掉弹层默认内边距与边框，让面板尺寸与用户端严格一致（288px 含 6px 内边距） */
.sep-popper {
    --el-popover-padding: 0;
    border: none;
}
</style>
