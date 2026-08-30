// src/plugins/theme-config.js
import defaultThemes from './default-theme'

// 集中管理所有主题配置
export const themeConfig = {
  defaultTheme: 'scorpion-light',  // 在这里定义默认主题
  themes: {
    'default-light': defaultThemes['default-light'],
    'default-dark': defaultThemes['default-dark'],
    'scorpion-light': {
      dark: false,
      colors: {
          primary: '#5B4BCF',
          secondary: '#6C5CE7',
          accent: '#8B7EED',
          // background: '#F5F3FF', F0EFF8|F8F7FF|F5F3FF|E8E6F5
          background: '#F0EFF8',        // 整体背景：纯白（最亮）
          surface: '#F5F3FF',          // 卡片背景：淡紫灰（比背景稍深，带紫色调）
          'surface-variant': '#E8E6F5', // 次级表面：更明显的淡紫色
          error: '#B00020',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
          // ========== 添加 tooltip 相关颜色 ==========
        'on-surface': '#1A1A2E',           // 表面上的文字颜色（浅色模式用深色）
        'on-surface-variant': '#2D2D44',    // 表面变体上的文字颜色
      }
    },
    'scorpion-dark': {
      dark: true,
      colors: {
            // 主品牌色 - SlateBlue 家族  
          primary: '#6A5ACD',     // SlateBlue（核心色）
          secondary: '#483D8B',   // DarkSlateBlue（深色层次）
          accent: '#7B68EE',      // MediumSlateBlue（高亮点缀）
          
          // 功能色
          error: '#FF5252',
          info: '#40C4FF',
          success: '#69F0AE',
          warning: '#FFB74D',
          
          // 背景色系
          background: '#0F0D1A',  // 深紫黑背景
          surface: '#1A1730',     // 卡片背景（带紫调）
          'surface-variant': '#262240',
          
          // 文字色
          'on-primary': '#FFFFFF',
          'on-background': '#E0DDF5',
          // ========== 添加 tooltip 相关颜色 ==========
          'on-surface': '#E0DDF5',           // 表面上的文字颜色（深色模式用浅色）
          'on-surface-variant': '#B8B4E8',    // 表面变体上的文字颜色
      }
    }
  },
  // 颜色变体配置 - 自动生成亮色和深色变体
  variations: {
    colors: ['primary', 'secondary', 'accent'],  // 对主色、次色、强调色生成变体
    lighten: 2,  // 生成2个亮色变体（lighten1, lighten2）
    darken: 3,   // 生成3个深色变体（darken1, darken2, darken3）
  }
}