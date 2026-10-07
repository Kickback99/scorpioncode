import { watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import websocketManager from '@/server/websocketManager'

export function useWebSocket(role = 'admin') {

  const route = useRoute()

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
    // 建连条件：已登录（有 userId）且不在登录页
    // 登录成功瞬间 userInfo 已就绪、路由还停在 /login，此刻建连会让后端下发的欢迎语弹在登录页
    const connect = () => {
        const userId = userStore.userInfo?.id
        if (!userId || route.path === '/login') return
        console.log('==================== 建立 websocket 连接 ====================')
        websocketManager.init(userId, role)
    }

    // 监听用户信息变化
        watch(() => userStore.userInfo, (newUserInfo,oldUserInfo) => {
            // console.log('👤 用户信息发生变化:', newUserInfo,oldUserInfo)
            if (newUserInfo?.id) {
                connect()
            } else if (oldUserInfo?.id) {
                // 登录态被清空（401 自愈 / 主动退出）：旧连接必须关掉，
                // 否则它在登录页继续收推送（如「管理员 张三 上线了」）
                websocketManager.close()
            }
        }, { deep: true, immediate: true })

    // 离开登录页时补建：上一次因路由还是 /login 被拦下了
    watch(() => route.path, (_newPath, oldPath) => {
        if (oldPath === '/login') connect()
    })

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