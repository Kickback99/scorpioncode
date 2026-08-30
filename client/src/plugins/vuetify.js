// src/plugins/vuetify.js
import { VBtn } from 'vuetify/components/VBtn'
import { themeConfig } from './theme-config'
export default {
    theme: themeConfig,
    defaults: {
      VBtn: { variant: 'outlined'},
      MyButton: { variant: 'tonal',color:'primary'},
    },
    aliases: {
      MyButton: VBtn, // 继承全局VBtn配置
      
    },
    display: {
      mobileBreakpoint: 'md', // 只有md以下(不包含)才为移动设备
    },
  }

/* const customTheme = {
  dark: false, // 默认为亮色主题
  colors: {
    primary: '#3f51b5',    // 主色
    secondary: '#673ab7',  // 次要色
    error: '#f44336',      // 错误色
    customBlue: '#2196F3', // 自定义颜色
  }
}

export default createVuetify({
  theme: {
    defaultTheme: 'custom', // 设为默认主题
    themes: {
      custom: customTheme, // 注册主题
    }
  }
}) */