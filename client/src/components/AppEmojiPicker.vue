<!-- components/AppEmojiPicker.vue -->
<template>
  <!-- ===== 表情选择面板 ===== -->
  <!-- 用 v-menu 不用 v-dialog：v-menu 的 scrollStrategy 是 reposition，不会加 v-overlay-scroll-blocked，
       避开「弹窗锁滚动导致热门文章提前收回」那个坑（见 docs/用户端评论刷新链路与视口治理.md） -->
  <!-- close-on-content-click 关掉：面板统一由 handlePick 收起，鼠标点选与键盘回车走同一条路 -->
  <v-menu
    v-if="configStore.isCommentEmojiEnabled"
    v-model="menuOpen"
    location="bottom start"
    transition="slide-y-transition"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <!-- icon 按钮的高度是 --v-btn-height + 12px，用 comfortable 密度抵掉这 12px，
           使尺寸与同排文字按钮一致（28px，即「发表评论」/「回复」的高度） -->
      <v-btn
        v-bind="activatorProps"
        icon
        variant="text"
        size="small"
        density="comfortable"
        title="插入表情"
        aria-label="插入表情"
        @mousedown="handleRememberCaret"
      >
        <v-icon size="18">mdi-emoticon-happy-outline</v-icon>
      </v-btn>
    </template>

    <v-sheet class="emoji-panel" :style="{ '--emoji-scale': scale }" elevation="4" rounded>
      <div class="emoji-grid">
        <!-- 静态字符网格用原生 button，246 个 v-btn 的组件实例与 ripple 不值当；
             mousedown.prevent 防止点选夺走输入框焦点（否则面板收起时焦点会被还到触发按钮） -->
        <button
          v-for="(emoji, i) in EMOJI_LIST"
          :key="i"
          type="button"
          class="emoji-cell"
          @mousedown.prevent
          @click="handlePick(emoji)"
          @keydown.enter.prevent.stop="handlePick(emoji)"
        >{{ emoji }}</button>
      </div>
    </v-sheet>
  </v-menu>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useDialogFontScale } from '@/composables/useDialogFontScale'
import { useConfigStore } from '@/store/config'
import { EMOJI_LIST } from '@/utils/emojis.js'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

const props = defineProps({
  modelValue: { type: String, default: '' },
  // 父级 v-textarea 的 ref：Vuetify forwardRefs 后即原生 textarea，用它读光标位置与 maxlength
  inputEl: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

// 面板被 v-menu 传送出评论卡片，继承不到父级的 --comment-scale，自己算
const scale = useDialogFontScale()

// 按下按钮那一刻记录的光标位置
const caret = ref(null)

// 面板开关：选中表情后主动收起
const menuOpen = ref(false)

// ============================================================
// 事件处理
// ============================================================
// 打开面板会让 textarea 失焦，个别移动端输入法失焦会重置 selectionStart，所以在 mousedown 时先记下来
const handleRememberCaret = () => {
  caret.value = props.inputEl?.selectionStart ?? null
}

// 在光标处插入表情。长度口径是 UTF-16 码元，与 textarea 的 maxlength、后端 String.length 一致（一个 emoji 占 2）
const handlePick = (emoji) => {
  const el = props.inputEl
  const max = el?.maxLength ?? -1

  // maxlength 只约束用户手输，程序化写入会绕过它，所以这里必须自己拦
  if (max > 0 && props.modelValue.length + emoji.length > max) {
    window.$snackbar?.warning(`最多 ${max} 字`)
    return
  }

  const at = Math.min(caret.value ?? el?.selectionStart ?? props.modelValue.length, props.modelValue.length)
  emit('update:modelValue', props.modelValue.slice(0, at) + emoji + props.modelValue.slice(at))

  caret.value = at + emoji.length
  menuOpen.value = false
  // v-model 回写 value 会把光标顶到末尾，必须等 DOM 更新后再设回去
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(at + emoji.length, at + emoji.length)
  })
}
</script>

<style scoped lang="scss">
// ============================================================
// 面板与网格（宽高、字号统一按 --emoji-scale 缩放，不写媒体查询）
// ============================================================
.emoji-panel {
  --emoji-scale: 1;
  padding: 6px;
  width: calc(288px * var(--emoji-scale));
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  max-height: calc(208px * var(--emoji-scale));
  overflow-y: auto;
}

.emoji-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: calc(1.125rem * var(--emoji-scale));
  line-height: 1;
  /* 指定彩色 emoji 字体，避免部分系统用文字字体渲染成单色字形 */
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

.emoji-cell:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}
</style>
