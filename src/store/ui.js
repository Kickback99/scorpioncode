import { defineStore } from 'pinia'

export const useUiStore = defineStore({
  id: 'ui',
  state: () => ({
    // ============================================================
    // UI 样式配置
    // ============================================================

    /** full | plain — 影响按钮 / 标签页等所有组件 */
    uiMode: 'full',
    /** full 模式: 0~100 light/dark 深度（默认 0） */
    uiDepthFull: 0,
    /** plain 模式: 混合度百分比（默认 35） */
    uiDepthPlain: 35,
    /** hover 强度 1~9（对应 light-1 ~ light-9） */
    hoverFull: 3,
    hoverPlain: 3,
    /** 文字色模式: 'preset'（配置文件）| 'dynamic'（自动计算亮度） */
    textColorMode: 'preset',
    /** 退出时暂存主题名，供登录页读取（避开 userConfig 被清空后丢失） */
    lastTheme: 'default',
  }),
  actions: {
    setUiMode(mode) {
      this.uiMode = mode
    },
    setUiDepthFull(depth) {
      this.uiDepthFull = depth
    },
    setUiDepthPlain(depth) {
      this.uiDepthPlain = depth
    },
    setHoverFull(level) {
      this.hoverFull = level
    },
    setHoverPlain(level) {
      this.hoverPlain = level
    },
    setTextColorMode(mode) {
      this.textColorMode = mode
    },
    setLastTheme(theme) {
      this.lastTheme = theme
    },
  },
  persist: {
    key: 'ui-store',
    paths: ['uiMode', 'uiDepthFull', 'uiDepthPlain', 'hoverFull', 'hoverPlain', 'textColorMode', 'lastTheme'],
  },
})
