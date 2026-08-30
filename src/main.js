//main.js
// Vuetify
import 'vuetify/styles'
import './assets/main.scss'
import { StealthStorage } from '@/utils/stealthStorage'

import { createApp } from 'vue'
import App from './App.vue'
// 导入路由
import router from './router'
// 导入pinia
import {createPinia} from 'pinia'
// 导入持久化插件
import persist from 'pinia-plugin-persistedstate'

// 全局导入mdi图标
import '@mdi/font/css/materialdesignicons.css'

// Vuetify 自动导入实例（来自 vite-plugin-vuetify）
import { createVuetify as autoImportVuetify } from 'vuetify'

// 外部配置实例
import vuetifyPlugins from './plugins/vuetify'

// 合并两个实例（保留自动导入+主题配置）
const vuetify = autoImportVuetify(vuetifyPlugins)

StealthStorage
  // localStorage：关闭标签页后强退标记仍存活，保证"刷新/关闭重开"都只弹一次登录框
  .init('localStorage', 'force_logout_pending', '__vite_check_hmr', 'salt1')
  .init('localStorage', 'show_long_text_snackbar', '__analytics_session_id', 'salt4')
//   .init('localStorage', 'draftContent', '__cache_draft_1', 'salt3');

const app = createApp(App)
app.use(vuetify) // 只需注册一次
app.use(router)
const pinia = createPinia() //创建Pinia实例
app.use(pinia.use(persist)) //安装pinia插件
app.mount('#app')
