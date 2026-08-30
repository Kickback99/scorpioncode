// ============================================================
// msg.js — Element Plus ElMessage 封装
// 一次封装，到处使用。所有方法支持 options 覆盖。
// ============================================================

// import { ElMessage } from 'element-plus'

/** 默认配置 */
const def = {
  grouping: true,
  offset: 60,
}

/** 合并 customClass */
function mergeClass(a, b) {
  return [a, b].filter(Boolean).join(' ')
}

/** 带 options 覆盖的快捷方法 */
function create(defaults) {
  return (message, options) => {
    // 对象模式: msg.primary({ message: '...', dangerouslyUseHTMLString: true })
    if (typeof message === 'object' && message !== null) {
      // 对象模式消息图标对齐第一行（适配多行 HTML 内容）
      const iconTop = !('icon' in message) ? 'msg-icon-top' : ''
      const customClass = mergeClass(def.customClass, mergeClass(defaults.customClass, mergeClass(iconTop, message.customClass)))
      return ElMessage({ ...def, ...defaults, ...message, customClass })
    }
    // 字符串模式: msg.primary('hello')
    const customClass = mergeClass(def.customClass, mergeClass(defaults.customClass, options?.customClass))
    return ElMessage({ ...def, ...defaults, ...options, customClass, message })
  }
}

// ============================================================
// 语义色方法（跟随 themePresets，自动适配 uiMode full/plain）
// ============================================================
const success = create({ type: 'success', customClass: 'msg-success' })
const warning = create({ type: 'warning', customClass: 'msg-warning' })
const error   = create({ type: 'error',   customClass: 'msg-error' })
const info    = create({ type: 'info',    customClass: 'msg-info' })

// ============================================================
// 主题色方法
// ============================================================
/** 主题色消息（跟随 themePresets primary） */
const primary = create({
  type: 'info',
  customClass: 'msg-primary',
})

// ============================================================
// 位置 / 样式组合
// ============================================================
/** 右上角 + 支持 HTML */
const topRightHtml = create({
  customClass: 'msg-top-right',
  dangerouslyUseHTMLString: true,
  offset: 40,
})

/** 底部居中 */
const bottom = create({
  customClass: 'msg-bottom',
  offset: 30,
})

// ============================================================
// 行为 / 交互
// ============================================================
/** 不自动关闭 */
const persistent = create({
  duration: 0,
  showClose: true,
})

/** 带关闭按钮 */
const closable = create({
  showClose: true,
})

// ============================================================
// 视觉变体
// ============================================================
/** 暗色背景 */
const dark = create({
  customClass: 'msg-dark',
})

/** 圆角 */
const roundMsg = create({
  customClass: 'msg-round',
})

/** 描边（plain 风格） */
const plainMsg = create({
  customClass: 'msg-plain',
})

/** 长文本（自动换行，宽度加大） */
const longText = create({
  customClass: 'msg-long-text',
})

// ============================================================
// 导出
// ============================================================
export const msg = {
  // 官方
  success,
  warning,
  error,
  info,
  // 主题色
  primary,
  // 位置/样式
  topRightHtml,
  bottom,
  // 行为
  persistent,
  closable,
  // 视觉
  dark,
  round: roundMsg,
  plain: plainMsg,
  longText,
}

export default msg
