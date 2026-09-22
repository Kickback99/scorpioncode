import { computed } from 'vue'
import { useDisplay } from 'vuetify'

/**
 * 移动端弹窗字号缩放
 * 在 display.mobile 时返回 mobileScale，否则返回 1
 * @param {number} mobileScale - 移动端缩放系数，默认 0.8
 * @returns {import('vue').ComputedRef<number>}
 */
export function useDialogFontScale(mobileScale = 0.8) {
  const display = useDisplay()
  return computed(() => (display.mobile.value ? mobileScale : 1))
}
