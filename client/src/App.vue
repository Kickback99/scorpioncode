<template>
<!-- 全局消息提示组件（置于 router-view 之前，确保 window.$snackbar/$dialog 在子组件请求前就绪） -->
<AppSnackbar/>

<!-- 全局对话框组件 -->
<AppDialog/>

<router-view></router-view>
</template>

<script setup>
import AppSnackbar from './components/AppSnackbar.vue';
import AppDialog from './components/AppDialog.vue';
import {useWebSocket} from '@/server/useWebSocket'
import { onMounted } from 'vue'
import { useConfigStore } from './store/config.js';
import { useUserStore } from './store/user.js'
import { loadClientConfig } from './router'
const configStore = useConfigStore()
const userStore = useUserStore()

// 初始化 WebSocket
const { initWebSocketListener, closeWebSocket } = useWebSocket()
import websocketManager from '@/server/websocketManager'

onMounted(async() => {
  // 等待配置加载完成，再判断 websocket 开关（避免使用默认值 true）
  await loadClientConfig()

  // cookie 模式：本地有 user 缓存时请求一次 userDetailInfo 校验登录态（未登录网友零请求）
  await userStore.verifyLogin()

  if(configStore.getWebsocketEnabled() && configStore.getWebsocketBackendEnabled()){
    // 检查并处理强退用户点击刷新标记
    await websocketManager.checkAndHandleForceLogout()

    initWebSocketListener()
  }
})
</script>

<style scoped lang="scss">

</style>