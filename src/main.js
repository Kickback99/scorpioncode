import './assets/style/index.scss'
import './assets/style/markdown.scss'
import './assets/style/toolbar-anim.scss'

import { createApp } from 'vue'
import App from './App.vue'
// 导入路由
import router from './router'
// 导入pinia
import {createPinia} from 'pinia'
// 导入持久化插件
import persist from 'pinia-plugin-persistedstate'

// 导入tailwindcss
import './assets/style/tailwind.css'

// element 暗黑模式样式
import 'element-plus/theme-chalk/dark/css-vars.css'

// 全局设置 el-dialog 默认不通过点击遮罩层关闭
import { ElDialog, ElInput } from 'element-plus'
ElDialog.props.closeOnClickModal.default = false
// 全局设置 el-dialog 顶部偏移：EP 默认 15vh 在宽屏上偏下，统一到 AntD 的 100px
ElDialog.props.top.default = '100px'
// 全局设置 el-input 默认可清空。clearable 是简写 Boolean，归一化时会被换成
// { type: Boolean }，改 .default 无效，必须整体替换；el-input-tag 有独立 props，不受影响
ElInput.props.clearable = { type: Boolean, default: true }

const app = createApp(App)
app.use(router)
const pinia = createPinia() // 创建Pinia实例
app.use(pinia.use(persist)) // 安装pinia插件

// 引入svg脚本
import 'virtual:svg-icons-register'

// 全局注册@iconify/vue图标库
import {
  OfflineIcon,
  OnlineIcon,
  SingleIcon,
  IconFont,
  SvgIcon
  } from "./components/MyIcon";
  app.component("OfflineIcon",OfflineIcon)
  app.component("OnlineIcon", OnlineIcon);
  app.component("SingleIcon", SingleIcon);
  app.component("IconFont", IconFont);
  app.component("SvgIcon", SvgIcon);

// 按钮权限指令：按 configStore.buttonPermissionMode 动态隐藏/禁用无权限按钮
import {directiveList} from '@/directives'
directiveList(app)

// 注册图标组件
import { registerIcons } from '@/data/elementIcons'
registerIcons(app)

import { addBatchIconList } from './components/MyIcon/src/iconifyBachOffline'
addBatchIconList([
  'ep:download',
  'ep:document',
  'ep:stamp',
  'ri:account-box-line',
  'ri:aliens-line',
  'ep:check',
  'ep:folder',
  'ep:chat-dot-round',
  'ep:chrome-filled',
  'ep:apple',
  'ri:delete-bin-fill',
  'ri:file-add-line',
  'ri:add-fill',
  'ri:delete-bin-3-fill',
  'ri:database-2-line',
  'ri:home-8-line',
  'ri:arrow-left-s-line',
  'ri:arrow-right-s-line'
  ])

app.mount('#app')
