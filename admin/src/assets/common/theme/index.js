// ============================================================
// 主题色引擎 — 从基色自动生成 Element Plus 完整色系并注入 DOM
// 同时注入按钮样式全局 CSS（plain / circle / depth）
// ============================================================

import { themePresets } from './presets'
import { useUiStore } from '@/store/ui'

/** hex → RGB */
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  }
}

/** RGB → #RRGGBB */
function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

/** 线性混合 */
function mix(c1, c2, ratio) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return rgbToHex({ r: a.r + (b.r - a.r) * ratio, g: a.g + (b.g - a.g) * ratio, b: a.b + (b.b - a.b) * ratio })
}

/** WCAG 相对亮度 — 动态计算模式用 */
function luminance(hex) {
  var rgb = hexToRgb(hex)
  var f = function (c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b)
}

// ============================================================
// 动态注入的 style 元素
// ============================================================
function ensureEl(id) {
  let el = document.getElementById(id)
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el) }
  return el
}

// ============================================================
// applyTheme — 核心入口
// ============================================================

/**
 * @param {string} themeName
 * @param {boolean} _isDark
 */
export function applyTheme(themeName, _isDark) {
  themeName = themeName || 'default'
  const preset = themePresets[themeName]
  if (!preset) return

  const uiStore = useUiStore()
  const btnStyle = uiStore.uiMode || 'full'
  const btnDepth = btnStyle === 'full' ? (uiStore.uiDepthFull != null ? uiStore.uiDepthFull : 0) : (uiStore.uiDepthPlain != null ? uiStore.uiDepthPlain : 35)

  const root = document.documentElement
  const types = ['primary', 'success', 'warning', 'danger', 'info']

  // 图表色 — 直接注入为 CSS 变量
  const chartColors = preset.colors.chart || []
  for (let i = 0; i < chartColors.length; i++) {
    root.style.setProperty('--el-color-chart-' + i, chartColors[i])
  }

  // light-1~9 / dark-2 永远完整色阶
  for (const t of types) {
    var c = preset.colors[t]
    setColorSeries(root, t, c.bg)

    // 文字色 — preset or 动态计算（full / plain 共用）
    var textColor
    if (uiStore.textColorMode === 'dynamic') {
      textColor = luminance(c.bg) > 0.4 ? '#1a1a1a' : '#ffffff'
    } else {
      // text 为 { light, dark } 对象，兼容旧字符串格式
      textColor = _isDark ? (c.text.dark || c.text) : (c.text.light || c.text)
    }
    root.style.setProperty('--el-color-' + t + '-text', textColor)

    if (btnStyle === 'full') {
      root.style.setProperty('--el-color-' + t + '-solid-bg', mix(c.bg, '#FFFFFF', btnDepth / 100))
    } else {
      root.style.setProperty('--el-color-' + t + '-plain', mix(c.bg, '#000000', btnDepth / 100))
      root.style.setProperty('--el-color-' + t + '-plain-bg', mix(c.bg, '#FFFFFF', 1 - btnDepth / 200))
    }
  }

  // 侧边栏 / 标签 / 页面 — 深浅模式用不同混合比
  const primary = preset.colors.primary.bg
  var blend = _isDark ? 0.88 : 0.58
  root.style.setProperty('--sidebar-bg', mix(primary, '#0a0a0f', blend))
  root.style.setProperty('--sidebar-text', '#eee')
  // tagMode=theme 标签栏：对齐 sidebar 同色底，激活略浅
  root.style.setProperty('--tab-theme-bg', mix(primary, '#0a0a0f', blend))
  root.style.setProperty('--tab-theme-hover-bg', mix(primary, '#0a0a0f', _isDark ? 0.75 : 0.45))
  // pageTheme 页面主题：比标签栏更深，形成页底层→标签层的视觉层次
  root.style.setProperty('--page-theme-bg', mix(primary, '#0a0a0f', _isDark ? 0.95 : 0.65))
  // 骨架屏闪烁色：深色用 dark-2（低调），浅色用 light-8（极淡）
  root.style.setProperty('--skeleton-shimmer', _isDark ? 'var(--el-color-primary-dark-2)' : 'var(--el-color-primary-light-8)')
  root.style.setProperty('--sidebar-active-text', primary)

  // el-menu
  root.style.setProperty('--el-menu-bg-color', mix(primary, '#0a0a0f', blend))
  root.style.setProperty('--el-menu-text-color', '#eee')
  root.style.setProperty('--el-menu-active-color', primary)
  root.style.setProperty('--el-menu-hover-bg-color', mix(primary, '#0a0a0f', _isDark ? 0.75 : 0.45))

  // html 类注入 — 供所有组件（tab / button 等）读取 uiMode
  root.classList.remove('ui-full', 'ui-plain')
  root.classList.add(btnStyle === 'plain' ? 'ui-plain' : 'ui-full')

  const hoverLevel = (btnStyle === 'full' ? uiStore.hoverFull : uiStore.hoverPlain) || 3
  injectButtonCss(types)
  injectHoverCss(types, hoverLevel)
  injectModalCss(types, hoverLevel)
  injectPaginationCss()
  // injectDrawerCss()
  injectSwitchCss()
  injectBadgeCss()
  injectCheckCss()
  injectTagCss(types)

  // tab 激活态变量 — full / plain 各一套
  root.style.setProperty('--tab-active-bg', 'var(--el-color-primary-solid-bg)')
  root.style.setProperty('--tab-active-hover-bg', 'var(--el-color-primary-light-' + hoverLevel + ')')
  root.style.setProperty('--tab-active-hover-plain-bg', 'var(--el-color-primary-light-' + hoverLevel + ')')

  injectDropdownCss()
  injectInputCss()
  injectSelectCss()
  injectMessageCss()
}

// ============================================================
// 颜色系列 + depth
// ============================================================
function setColorSeries(root, type, base) {
  root.style.setProperty('--el-color-' + type, base)
  for (var i = 1; i <= 9; i++) {
    root.style.setProperty('--el-color-' + type + '-light-' + i, mix(base, '#FFFFFF', i / 10))
  }
  root.style.setProperty('--el-color-' + type + '-dark-2', mix(base, '#000000', 0.2))
}

// ============================================================
// 按钮全局样式 — 通过 .ui-full / .ui-plain 跟随 uiMode
// ============================================================
var _buttonCssEl = null
function injectButtonCss(types) {
  _buttonCssEl = ensureEl('theme-button-fix')
  var css = ''
  for (var i = 0; i < types.length; i++) {
    var t = types[i]
    // full — 实心填充
    css += '.ui-full .el-button--' + t + ':not(.is-disabled){' +
      'color:var(--el-color-' + t + '-text)!important;' +
      '--el-button-text-color:var(--el-color-' + t + '-text)!important;' +
      '--el-button-bg-color:var(--el-color-' + t + '-solid-bg)!important;' +
      '--el-button-border-color:var(--el-color-' + t + '-solid-bg)!important;' +
      '}' +
    // plain — 描边（hover bg/border 由 injectHoverCss 控制，避免覆盖 hoverLevel）
    '.ui-plain .el-button--' + t + ':not(.is-disabled){' +
      'color:var(--el-color-' + t + '-plain);' +
      '--el-button-text-color:var(--el-color-' + t + '-plain);' +
      '--el-button-bg-color:var(--el-color-' + t + '-plain-bg);' +
      '--el-button-border-color:var(--el-color-' + t + '-plain);' +
      '--el-button-hover-text-color:var(--el-color-' + t + '-text);' +
      '--el-button-active-color:var(--el-color-' + t + '-plain);' +
      '}' +
    // plain — hover 文字色直接写 color，CSS 变量可能被 EP 内部覆盖
    '.ui-plain .el-button--' + t + ':not(.is-disabled):hover{' +
      'color:var(--el-color-' + t + '-text)!important;' +
      '}' +
    // disabled — 全量直接覆写 property，不走 EP 变量机制
    '.ui-full .el-button--' + t + '.is-disabled:not(.is-link){' +
      'color:var(--el-color-white)!important;' +
      'background-color:var(--el-color-' + t + '-light-5)!important;' +
      'border-color:var(--el-color-' + t + '-light-5)!important;' +
      '}' +
    '.ui-plain .el-button--' + t + '.is-disabled:not(.is-link){' +
      'color:var(--el-color-' + t + '-light-5)!important;' +
      '--el-button-disabled-text-color:var(--el-color-' + t + '-light-5)!important;' +
      '--el-button-disabled-bg-color:transparent!important;' +
      '}'
  }
  // link 按钮：full 模式下文字保持主色，不变黑白
  for (var j = 0; j < types.length; j++) {
    var tt = types[j]
    css += '.ui-full .el-button--' + tt + '.is-link:not(.is-disabled){' +
      'color:var(--el-color-' + tt + ')!important;' +
      'background:transparent!important;' +
      'border-color:transparent!important;' +
      '--el-button-text-color:var(--el-color-' + tt + ')!important;' +
      '}' +
    // plain — 保持主色
    '.ui-plain .el-button--' + tt + '.is-link:not(.is-disabled){' +
      'color:var(--el-color-' + tt + ')!important;' +
      'background:transparent!important;' +
      'border-color:transparent!important;' +
      '--el-button-text-color:var(--el-color-' + tt + ')!important;' +
      '}' +
    // link disabled — 恢复原生灰色低调样式
    '.el-button--' + tt + '.is-link.is-disabled{' +
      'color:var(--el-text-color-placeholder)!important;' +
      '}'
  }
  // 默认按钮（无 type，如 icon 按钮的 is-plain）跟随 uiMode
  var defBtn = '.el-button.is-plain:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(.el-button--info)'
  css += '.ui-full ' + defBtn + '{' +
    '--el-button-hover-bg-color:var(--el-color-primary)!important;' +
    '--el-button-hover-border-color:var(--el-color-primary)!important;' +
    '--el-button-hover-text-color:var(--el-color-primary-text)!important;' +
    '}' +
    '.ui-plain ' + defBtn + '{' +
    '--el-button-hover-bg-color:var(--el-color-primary-plain-bg)!important;' +
    '--el-button-hover-border-color:var(--el-color-primary-plain)!important;' +
    '--el-button-hover-text-color:var(--el-color-primary-plain)!important;' +
    '}'
  _buttonCssEl.textContent = css
}

// ============================================================
// hover 强度注入 — 控制 el-button hover 时背景色明亮度
// ============================================================
var _hoverCssEl = null
function injectHoverCss(types, level) {
  _hoverCssEl = ensureEl('theme-hover-fix')
  var css = ''
  for (var i = 0; i < types.length; i++) {
    var t = types[i]
    css += '.el-button--' + t + ':not(.is-plain){' +
      '--el-button-hover-bg-color:var(--el-color-' + t + '-light-' + level + ');' +
      '--el-button-hover-border-color:var(--el-color-' + t + '-light-' + level + ');' +
      '}' +
      '.el-button--' + t + '.is-plain{' +
      '--el-button-hover-bg-color:var(--el-color-' + t + '-light-' + level + ');' +
      '--el-button-hover-border-color:var(--el-color-' + t + '-light-' + level + ');' +
      '}'
  }
  _hoverCssEl.textContent = css
}

// ============================================================
// checkbox + radio-button — 跟随 .ui-full / .ui-plain
// ============================================================
var _checkCssEl = null
function injectCheckCss() {
  var radioSel = '.el-radio-button.is-active .el-radio-button__inner,' +
                 '.el-radio-button__original-radio:checked+.el-radio-button__inner'
  _checkCssEl = ensureEl('theme-check-fix')
  _checkCssEl.textContent =
    // checkbox
    '.ui-full .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked .el-checkbox__inner{' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'border-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-full .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked .el-checkbox__inner::after{' +
    'border-color:var(--el-color-primary-text)!important;' +
    '}' +
    '.ui-full .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked+.el-checkbox__label{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    '.ui-plain .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked .el-checkbox__inner{' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-plain .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked .el-checkbox__inner::after{' +
    'border-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-plain .el-checkbox:not(.is-disabled) .el-checkbox__input.is-checked+.el-checkbox__label{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    // el-radio — full: 圆点实心填充 + 标签用主色（无背景，不能白字）
    '.ui-full .el-radio:not(.is-disabled) .el-radio__input.is-checked .el-radio__inner{' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'border-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-full .el-radio:not(.is-disabled) .el-radio__input.is-checked .el-radio__inner::after{' +
    'background-color:var(--el-color-primary-text)!important;' +
    '}' +
    '.ui-full .el-radio:not(.is-disabled) .el-radio__input.is-checked+.el-radio__label{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    '.ui-plain .el-radio:not(.is-disabled) .el-radio__input.is-checked .el-radio__inner{' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-plain .el-radio:not(.is-disabled) .el-radio__input.is-checked .el-radio__inner::after{' +
    'background-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-plain .el-radio:not(.is-disabled) .el-radio__input.is-checked+.el-radio__label{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    // radio-button
    '.ui-full ' + radioSel + '{' +
    'color:var(--el-color-primary-text)!important;' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'border-color:var(--el-color-primary-solid-bg)!important;' +
    'box-shadow:-1px 0 0 0 var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-plain ' + radioSel + '{' +
    'color:var(--el-color-primary-plain)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border-color:var(--el-color-primary-plain)!important;' +
    'box-shadow:-1px 0 0 0 var(--el-color-primary-plain)!important;' +
    '}' +
    '.el-radio-button .el-radio-button__inner:hover{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    // el-tree 选中文字（.el-tree-node__label + 自定义 slot 兜底）
    '.ui-full .el-tree-node.is-checked .el-tree-node__label,' +
    '.ui-full .el-tree-node.is-checked .el-tree-node__content{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    '.ui-plain .el-tree-node.is-checked .el-tree-node__label,' +
    '.ui-plain .el-tree-node.is-checked .el-tree-node__content{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    // indeterminate 半选复选框跟随 uiMode
    '.ui-full .el-checkbox__input.is-indeterminate .el-checkbox__inner{' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'border-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-full .el-checkbox__input.is-indeterminate .el-checkbox__inner::before{' +
    'background-color:var(--el-color-primary-text)!important;' +
    '}' +
    '.ui-plain .el-checkbox__input.is-indeterminate .el-checkbox__inner{' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-plain .el-checkbox__input.is-indeterminate .el-checkbox__inner::before{' +
    'background-color:var(--el-color-primary-plain)!important;' +
    '}'
}

// ============================================================
// dropdown 全局样式 — 通过 .ui-full / .ui-plain 跟随 uiMode
// ============================================================
var _dropdownCssEl = null
function injectDropdownCss() {
  _dropdownCssEl = ensureEl('theme-dropdown-fix')
  var item = '.el-dropdown-menu__item:not(.is-disabled)'
  _dropdownCssEl.textContent =
    '.ui-full ' + item + ':focus,' +
    '.ui-full ' + item + ':hover,' +
    '.ui-full ' + item + '.is-active{' +
    'color:var(--el-color-primary-text)!important;' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-plain ' + item + ':focus,' +
    '.ui-plain ' + item + ':hover,' +
    '.ui-plain ' + item + '.is-active{' +
    'color:var(--el-color-primary-plain)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    '}'
}

// ============================================================
// input 输入框 — hover / focus 边框色跟随 .ui-full / .ui-plain
// ============================================================
var _inputCssEl = null
function injectInputCss() {
  _inputCssEl = ensureEl('theme-input-fix')
  // 覆盖 el-input / el-select 内嵌 input 的 focus 状态
  var focusSel = '.el-input.is-focus .el-input__wrapper,' +
                 '.el-input .el-input__wrapper.is-focus,' +
                 '.el-select .el-input.is-focus .el-input__wrapper'
  _inputCssEl.textContent =
    // full — 实心主色边框
    '.ui-full .el-input .el-input__wrapper:hover,' +
    '.ui-full .el-select .el-input .el-input__wrapper:hover{' +
    'box-shadow:0 0 0 1px var(--el-color-primary-solid-bg) inset!important;' +
    '}' +
    '.ui-full ' + focusSel + '{' +
    'box-shadow:0 0 0 1px var(--el-color-primary) inset!important;' +
    '}' +
    // plain — 描边主色边框
    '.ui-plain .el-input .el-input__wrapper:hover,' +
    '.ui-plain .el-select .el-input .el-input__wrapper:hover{' +
    'box-shadow:0 0 0 1px var(--el-color-primary-plain) inset!important;' +
    '}' +
    '.ui-plain ' + focusSel + '{' +
    'box-shadow:0 0 0 1px var(--el-color-primary-plain) inset!important;' +
    '}' +
    // el-tree 内 input 不受全局规则影响（由 tree-line-* 接管）
    '.el-tree.tree-line-solid .el-input__wrapper,' +
    '.el-tree.tree-line-dashed .el-input__wrapper,' +
    '.el-tree.tree-line-none .el-input__wrapper{' +
    'box-shadow:none!important;' +
    '}' +
    '.el-tree.tree-line-solid .el-input__wrapper:hover,' +
    '.el-tree.tree-line-dashed .el-input__wrapper:hover,' +
    '.el-tree.tree-line-none .el-input__wrapper:hover{' +
    'box-shadow:none!important;' +
    '}'
}

// ============================================================
// select 下拉面板 — 选中项 / hover 跟随 .ui-full / .ui-plain
// ============================================================
var _selectCssEl = null
function injectSelectCss() {
  _selectCssEl = ensureEl('theme-select-fix')
  _selectCssEl.textContent =
    // full — 选中：实心底色+文字色
    '.ui-full .el-select-dropdown__item.is-selected{' +
    'color:var(--el-color-primary-text)!important;' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'font-weight:400!important;' +
    '}' +
    // full - 未选中
    '.ui-full .el-select-dropdown__item:not(.is-disabled):not(.is-selected):hover{' +
    'color:var(--el-text-color-regular)!important;' +
    'background-color:var(--el-fill-color-light)!important;' +
    '}' +
    // plain — 选中：浅底色+主色字
    '.ui-plain .el-select-dropdown__item.is-selected{' +
    'color:var(--el-color-primary)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'font-weight:400!important;' +
    '}' + 
    // plain - 未选中
    '.ui-plain .el-select-dropdown__item:not(.is-disabled):not(.is-selected):hover{' +
    'color:var(--el-text-color-regular)!important;' +
    'background-color:var(--el-fill-color-light)!important;' +
    '}'
}

// ============================================================
// el-message 全局样式 — .ui-full / .ui-plain + 自定义 class
// ============================================================
var _messageCssEl = null
function injectMessageCss() {
  _messageCssEl = ensureEl('theme-message-fix')
  // 语义类型 → 主题色变量名（error 映射到 danger）
  var types = [
    { cls: 'primary', v: 'primary' },
    { cls: 'success', v: 'success' },
    { cls: 'warning', v: 'warning' },
    { cls: 'error',   v: 'danger' },
    { cls: 'info',    v: 'info' },
  ]
  var css = ''
  for (var i = 0; i < types.length; i++) {
    var t = types[i]
    css += '.ui-full .msg-' + t.cls + '{' +
      '--el-message-bg-color:var(--el-color-' + t.v + '-solid-bg);' +
      '--el-message-text-color:var(--el-color-' + t.v + '-text);' +
      '--el-message-border-color:var(--el-color-' + t.v + '-solid-bg);' +
      '--el-message-close-icon-color:var(--el-color-' + t.v + '-text);' +
      '}' +
      '.ui-plain .msg-' + t.cls + '{' +
      '--el-message-bg-color:var(--el-color-' + t.v + '-plain-bg);' +
      '--el-message-text-color:var(--el-color-' + t.v + '-plain);' +
      '--el-message-border-color:var(--el-color-' + t.v + '-plain);' +
      '--el-message-close-icon-color:var(--el-color-' + t.v + '-plain);' +
      '}'
  }
  css += '.msg-dark{' +
    '--el-message-bg-color:#303133;--el-message-text-color:#eee;' +
    '--el-message-border-color:#606266;' +
    '}' +
    '.msg-plain{' +
    '--el-message-bg-color:var(--el-color-primary-plain-bg);' +
    '--el-message-text-color:var(--el-color-primary-plain);' +
    '--el-message-border-color:var(--el-color-primary-plain);' +
    '}' +
    '.msg-round{border-radius:20px;}' +
    '.msg-long-text{max-width:600px;word-break:break-word;}' +
    '.msg-top-right{' +
    'position:fixed;top:10px;right:20px;' +
    'left:auto!important;transform:none!important;' +
    '}' +
    '.msg-bottom{' +
    'position:fixed;top:auto!important;bottom:10px;' +
    'left:50%!important;transform:translateX(-50%)!important;' +
    '}'
  _messageCssEl.textContent = css
}

// ============================================================
// popconfirm / message-box 按钮 — 跟随 .ui-full / .ui-plain
// ============================================================
var _modalCssEl = null
function injectModalCss(types, hoverLevel) {
  _modalCssEl = ensureEl('theme-modal-fix')
  var css = ''
  for (var i = 0; i < types.length; i++) {
    var t = types[i]
    var msgBox = '.el-message-box__btns .el-button--' + t
    var pop = '.el-popconfirm__action .el-button--' + t
    // full — hover 跟随 hoverLevel
    css += '.ui-full ' + msgBox + ',' + '.ui-full ' + pop + '{' +
      'color:var(--el-color-' + t + '-text)!important;' +
      '--el-button-bg-color:var(--el-color-' + t + '-solid-bg)!important;' +
      '--el-button-border-color:var(--el-color-' + t + '-solid-bg)!important;' +
      '--el-button-hover-text-color:var(--el-color-white)!important;' +
      '--el-button-hover-bg-color:var(--el-color-' + t + '-light-' + hoverLevel + ')!important;' +
      '--el-button-hover-border-color:var(--el-color-' + t + '-light-' + hoverLevel + ')!important;' +
      '}' +
    // plain — hover 跟随 hoverLevel
    '.ui-plain ' + msgBox + ',' + '.ui-plain ' + pop + '{' +
      'color:var(--el-color-' + t + '-plain)!important;' +
      '--el-button-text-color:var(--el-color-' + t + '-plain)!important;' +
      '--el-button-bg-color:var(--el-color-' + t + '-plain-bg)!important;' +
      '--el-button-border-color:var(--el-color-' + t + '-plain)!important;' +
      '--el-button-hover-text-color:var(--el-color-white)!important;' +
      '--el-button-hover-bg-color:var(--el-color-' + t + '-light-' + hoverLevel + ')!important;' +
      '}'
  }
  // 取消按钮（默认 el-button）hover 保持中性，不跟随主题色
  var cancel = '.el-message-box__btns .el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(.el-button--info),' +
               '.el-popconfirm__action .el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(.el-button--info)'
  css += cancel + '{' +
    '--el-button-hover-text-color:var(--el-text-color-primary)!important;' +
    '--el-button-hover-bg-color:var(--el-fill-color-light)!important;' +
    '--el-button-hover-border-color:var(--el-border-color)!important;' +
    '--el-button-active-border-color:var(--el-border-color)!important;' +
    '--el-button-active-bg-color:var(--el-fill-color-light)!important;' +
    '}' +
    cancel + ':focus,' + cancel + ':focus-visible{' +
    'outline:none!important;box-shadow:none!important;' +
    '}' +
    cancel + ':active{' +
    'border-color:var(--el-border-color)!important;' +
    '}'
  _modalCssEl.textContent = css
}

// ============================================================
// pagination 分页 — 跟随 .ui-full / .ui-plain
// ============================================================
var _paginationCssEl = null
function injectPaginationCss() {
  _paginationCssEl = ensureEl('theme-pagination-fix')
  _paginationCssEl.textContent =
    '.ui-full .el-pager li.is-active{' +
    'color:var(--el-color-primary-text)!important;' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-plain .el-pager li.is-active{' +
    'color:var(--el-color-primary-plain)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border-color:var(--el-color-primary-plain)!important;' +
    '}' +
    '.ui-full .el-pager li:not(.is-active):hover,' +
    '.ui-full .btn-next:hover,' +
    '.ui-full .btn-prev:hover{' +
    'color:var(--el-color-primary)!important;' +
    '}' +
    '.ui-plain .el-pager li:not(.is-active):hover,' +
    '.ui-plain .btn-next:hover,' +
    '.ui-plain .btn-prev:hover{' +
    'color:var(--el-color-primary-plain)!important;' +
    '}'
}

// ============================================================
// drawer 抽屉 — 跟随 .ui-full / .ui-plain
// ============================================================
/* var _drawerCssEl = null
function injectDrawerCss() {
  _drawerCssEl = ensureEl('theme-drawer-fix')
  _drawerCssEl.textContent =
    '.ui-full .el-drawer__header{' +
    'color:var(--el-color-primary-text)!important;' +
    '--el-drawer-title-text-color:var(--el-color-primary-text);' +
    'background-color:var(--el-color-primary-solid-bg);' +
    'padding-bottom:14px;margin-bottom:6px;' +
    '}' +
    '.ui-full .el-drawer__close-btn{' +
    'color:var(--el-color-primary-text)!important;' +
    '}' +
    '.ui-full .el-drawer__close-btn:hover{' +
    'color:var(--el-color-primary-text)!important;' +
    'background-color:var(--el-color-primary-light-5)!important;' +
    '}' +
    '.ui-plain .el-drawer__header{' +
    '--el-drawer-title-text-color:var(--el-color-primary-plain);' +
    'border-bottom:1.5px solid var(--el-color-primary);' +
    'padding-bottom:14px;margin-bottom:6px;' +
    '}' +
    '.ui-plain .el-drawer__close-btn:hover{' +
    'color:var(--el-color-primary-plain)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    '}'
} */

// ============================================================
// switch 开关 — 跟随 .ui-full / .ui-plain
// ============================================================
var _switchCssEl = null
function injectSwitchCss() {
  _switchCssEl = ensureEl('theme-switch-fix')
  _switchCssEl.textContent =
    '.ui-full .el-switch.is-checked .el-switch__core{' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    'border-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-plain .el-switch.is-checked .el-switch__core{' +
    'background-color:var(--el-color-primary-plain)!important;' +
    'border-color:var(--el-color-white)!important;' +
    '}'
}

// ============================================================
// badge 徽标 — 跟随 .ui-full / .ui-plain
// ============================================================
var _badgeCssEl = null
function injectBadgeCss() {
  _badgeCssEl = ensureEl('theme-badge-fix')
  _badgeCssEl.textContent =
    '.ui-full .el-badge__content{' +
    'background-color:var(--el-color-primary-solid-bg)!important;' +
    '}' +
    '.ui-plain .el-badge__content{' +
    'color:var(--el-color-primary-plain)!important;' +
    'background-color:var(--el-color-primary-plain-bg)!important;' +
    'border:1px solid var(--el-color-primary-plain)!important;' +
    '}'
}

// ============================================================
// tag 标签 — 跟随 .ui-full / .ui-plain
// ============================================================
var _tagCssEl = null
function injectTagCss(types) {
  _tagCssEl = ensureEl('theme-tag-fix')
  var css = ''
  for (var i = 0; i < types.length; i++) {
    var t = types[i]
    css += '.ui-full .el-tag--' + t + '{' +
      'color:var(--el-color-' + t + '-text)!important;' +
      'background-color:var(--el-color-' + t + '-solid-bg)!important;' +
      'border-color:var(--el-color-' + t + '-solid-bg)!important;' +
      '}' +
      '.ui-plain .el-tag--' + t + '{' +
      'color:var(--el-color-' + t + '-plain)!important;' +
      'background-color:var(--el-color-' + t + '-plain-bg)!important;' +
      'border-color:var(--el-color-' + t + '-plain)!important;' +
      '}'
  }
  _tagCssEl.textContent = css
}
