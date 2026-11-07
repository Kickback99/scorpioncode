// 密码可见性切换：type 在 password/text 之间切换时，Chromium/Edge 会把输入框光标静默重置到最前
// （Firefox、移动端 WebKit 无此行为）。重置发生在 Vue 更新之后、下一帧渲染之前，
// 全程不调用 setSelectionRange/value，无法在同步流程里补救，只能在下一帧还原光标。

import { ref } from 'vue'

/**
 * 密码可见性开关：visible 绑定 input 的 type 与眼睛图标，toggle 直接作为图标的点击事件
 * 图标随可见性切换：可见时 mdi-eye-off，隐藏时 mdi-eye（由模板的 append-inner-icon 绑定）
 */
export const usePasswordVisibility = () => {
  const visible = ref(false)

  const toggle = (event) => {
    const input = event?.target?.closest?.('.v-field')?.querySelector('input')
    const caret = input && [input.selectionStart, input.selectionEnd]

    visible.value = !visible.value

    if (!caret) return

    requestAnimationFrame(() => {
      // 光标还在输入框内才还原，避免干扰用户在其他输入框的操作
      if (document.activeElement === input) {
        input.setSelectionRange(caret[0], caret[1])
      }
    })
  }

  return { visible, toggle }
}
