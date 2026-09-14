import { VBtn } from 'vuetify/components/VBtn'
import { themeConfig } from './theme-config'
import iconsConfig from './icons'
export default {
    theme: themeConfig,
    icons: iconsConfig,
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