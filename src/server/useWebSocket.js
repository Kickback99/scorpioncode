import { watch, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import websocketManager from '@/server/websocketManager'

export function useWebSocket(role = 'admin') {

  // 初始化 WebSocket 监听
/*   const initWebSocketListener = () => {
    // 监听用户信息变化
    const stopWatch = watch(
      () => userStore.userInfo?.id,
      (newUserId, oldUserId) => {
        console.log('👤 用户ID变化:', { old: oldUserId, new: newUserId })
        
        if (newUserId && newUserId !== oldUserId) {
          console.log('✅ 检测到新用户ID，初始化 WebSocket')
          websocketManager.init(newUserId)
        } else if (!newUserId && oldUserId) {
          console.log('❌ 用户ID被清空，关闭 WebSocket')
          websocketManager.close()
        }
      },
      { immediate: true }
    ) */
 // 初始化 WebSocket 监听
  const initWebSocketListener = () => {
      const userStore = useUserStore()
    // 监听用户信息变化
        watch(() => userStore.userInfo, (newUserInfo,oldUserInfo) => {
            // console.log('👤 用户信息发生变化:', newUserInfo,oldUserInfo)
            if (newUserInfo?.id) {
                // console.log(`✅ 检测到有效userId，初始化WebSocket (角色: ${role})`)
                console.log('==================== 建立 websocket 连接 ====================')
               websocketManager.init(newUserInfo.id, role)
            }
        }, { deep: true, immediate: true })


    // 组件卸载时停止监听
    /* onUnmounted(() => {
      stopWatch()
      // 注意：这里不关闭 WebSocket，因为可能其他组件还在使用
    }) */
  }

  // 获取原始 socket
  const getSocket = () => {
        return websocketManager.getSocket()
  }

  // 手动关闭连接
  const closeWebSocket = () => {
    websocketManager.close()
  }

  // 获取连接状态
  const getWebSocketStatus = () => {
    return websocketManager.getStatus()
  }

  // 发送消息
  const sendWebSocketMessage = (message) => {
    websocketManager.send(message)
  }

  return {
    initWebSocketListener,
    closeWebSocket,
    getWebSocketStatus,
    sendWebSocketMessage,
    getSocket 
  }
}