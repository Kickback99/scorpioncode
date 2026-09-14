// ============================================================
// 按钮样式 composable — 供 list.vue 的 el-table 操作栏使用
// ============================================================

import { computed } from 'vue'
import { useUiStore } from '@/store/ui'

/**
 * @example
 * const { btnProps, btnLabel } = useActionButton()
 * // template:
 * // <el-button v-bind="btnProps('primary', 'Edit')" @click="...">{{ btnLabel('编辑') }}</el-button>
 */
export function useActionButton() {
  const uiStore = useUiStore()

  const style = computed(() => uiStore.uiMode)
  const isPlain = computed(() => style.value === 'plain')

  /**
   * 生成 el-button 的绑定属性
   * @param {'primary'|'success'|'warning'|'danger'|'info'} type
   * @param {string} icon - 图标名字符串
   * @returns {object}
   */
  function btnProps(type, icon) {
    type = type || 'primary'
    const props = { size: 'small', type }
    if (icon) props.icon = icon
    if (isPlain.value) props.plain = true
    return props
  }

  /**
   * 按钮文字
   * @param {string} text
   * @returns {string}
   */
  function btnLabel(text) {
    return text
  }

  return { btnProps, btnLabel, style, isPlain }
}
