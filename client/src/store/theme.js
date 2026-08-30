// src/store/theme.js
import { defineStore } from 'pinia'
import { themeConfig } from '@/plugins/theme-config'

// 计算配置的哈希值（简单版）
const getConfigHash = () => {
  const configStr = JSON.stringify({
    defaultTheme: themeConfig.defaultTheme,
    themeKeys: Object.keys(themeConfig.themes)
  })
  // 简单的哈希
  let hash = 0
  for (let i = 0; i < configStr.length; i++) {
    hash = ((hash << 5) - hash) + configStr.charCodeAt(i)
    hash |= 0
  }
  return hash.toString()
}


export const useThemeStore = defineStore('theme', {
  state: () => ({
    configHash: getConfigHash(),  // 存储配置哈希
    currentTheme: themeConfig.defaultTheme
  }),
  
  getters: {
    isDark: (state) => state.currentTheme?.endsWith('-dark') || false,
    
    currentBase: (state) => {
      if (!state.currentTheme) return 'default'
      return state.currentTheme.replace('-light', '').replace('-dark', '')
    }
  },
  
  actions: {
    /**
     * 检查配置是否变化
     */
    isConfigChanged() {
      return this.configHash !== getConfigHash()
    },


    /**
     * 设置当前主题（直接设置，不验证）
     */
    setTheme(themeName) {
      this.currentTheme = themeName
    },
    
    /**
     * 验证主题是否有效
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     * @param {string} themeName - 要验证的主题名
     * @returns {boolean}
     */
    isValidTheme(vuetifyTheme, themeName) {
      const availableThemes = Object.keys(vuetifyTheme.themes.value)
      return availableThemes.includes(themeName)
    },
    
    /**
     * 获取有效的主题（如果主题无效，返回默认主题）
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     * @param {string} themeName - 要验证的主题名
     * @returns {string}
     */
    getValidTheme(vuetifyTheme, themeName) {
      if (this.isValidTheme(vuetifyTheme, themeName)) {
        return themeName
      }
      return themeConfig.defaultTheme
    },
    
    /**
     * 应用主题到 Vuetify 并同步到 Store
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     * @param {string} themeName - 要应用的主题名
     */
    applyTheme(vuetifyTheme, themeName) {
      const validTheme = this.getValidTheme(vuetifyTheme, themeName)
      vuetifyTheme.global.name.value = validTheme
      this.currentTheme = validTheme
      this.syncScrollbarTheme(vuetifyTheme)
    },

    /**
     * 同步当前主题色到 CSS 变量，供 main.scss 全局滚动条使用
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     */
    syncScrollbarTheme(vuetifyTheme) {
      const colors = vuetifyTheme.global.current.value.colors
      document.documentElement.style.setProperty('--scrollbar-thumb-color', colors['primary'])
    },
    
    /**
     * 切换主题（深浅切换）
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     */
    toggleTheme(vuetifyTheme) {
      const currentName = vuetifyTheme.global.name.value
      const currentBase = currentName.replace('-light', '').replace('-dark', '')
      const isDark = currentName.endsWith('-dark')
      const targetSuffix = isDark ? 'light' : 'dark'
      const targetTheme = `${currentBase}-${targetSuffix}`
      
      // 获取所有可用主题
      const availableThemes = Object.keys(vuetifyTheme.themes.value)
      
      // 检查目标主题是否存在
      if (availableThemes.includes(targetTheme)) {
        vuetifyTheme.global.name.value = targetTheme
        this.currentTheme = targetTheme
      } else {
        // 兜底：切换到 default 的对应模式
        const fallbackTheme = `default-${targetSuffix}`
        if (availableThemes.includes(fallbackTheme)) {
          vuetifyTheme.global.name.value = fallbackTheme
          this.currentTheme = fallbackTheme
        }
      }
      this.syncScrollbarTheme(vuetifyTheme)
    },
    
    /**
     * 初始化主题（从 Store 恢复，应用到 Vuetify）
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     */
    initTheme(vuetifyTheme) {
      // 配置变化了，清除旧数据
      if (this.isConfigChanged()) {
        // console.log('主题配置已更新，重置缓存')
        this.configHash = getConfigHash()
        this.currentTheme = themeConfig.defaultTheme
      }

        // 验证主题有效性
      if (!this.isValidTheme(vuetifyTheme, this.currentTheme)) {
        console.warn(`主题 "${this.currentTheme}" 不存在，回退到默认主题`)
        this.currentTheme = themeConfig.defaultTheme
      }
      
      // 验证并应用主题
      this.applyTheme(vuetifyTheme, this.currentTheme)
    },
    
    /**
     * 重置主题到配置的默认值
     * @param {Object} vuetifyTheme - useTheme() 返回的对象
     */
    resetToDefaultTheme(vuetifyTheme) {
      this.applyTheme(vuetifyTheme, themeConfig.defaultTheme)
    }
  },
  
  persist: true
})