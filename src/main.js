import 'vuetify/styles'
import './assets/styles/fonts.scss'
import './assets/main.scss'
import './assets/styles/markdown-preview.scss'
import { StealthStorage } from '@/utils/stealthStorage'

import { createApp } from 'vue'
import App from './App.vue'
// 导入路由
import router from './router'
// 导入pinia
import {createPinia} from 'pinia'
// 导入持久化插件
import persist from 'pinia-plugin-persistedstate'

// Vuetify 自动导入实例（来自 vite-plugin-vuetify）
import { createVuetify as autoImportVuetify } from 'vuetify'

// 主题 store（挂载前同步持久化主题，避免 Vuetify 先按默认浅色主题渲染再切深色）
import { useThemeStore } from '@/store/theme'

// 外部配置实例
import vuetifyPlugins from './plugins/vuetify'

// 合并两个实例（保留自动导入+主题配置）
const vuetify = autoImportVuetify(vuetifyPlugins)

StealthStorage
  // localStorage：关闭标签页后强退标记仍存活，保证"刷新/关闭重开"都只弹一次登录框
  .init('localStorage', 'force_logout_pending', '__vite_check_hmr', 'salt1')
  .init('localStorage', 'show_long_text_snackbar', '__analytics_session_id', 'salt4')

const app = createApp(App)
app.use(vuetify) // 只需注册一次
app.use(router)
const pinia = createPinia() //创建Pinia实例
app.use(pinia.use(persist)) //安装pinia插件
// 挂载前同步持久化主题：Vuetify 默认按 scorpion-light 创建，这里提前应用 store 里的深色主题，
// 避免刷新时先浅色再深色（配合 index.html 内联脚本彻底消除刷新闪白）
useThemeStore(pinia).initTheme(vuetify.theme)
app.mount('#app')
