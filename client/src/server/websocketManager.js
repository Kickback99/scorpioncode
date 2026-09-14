import { useUserStore } from '@/store/user'
import router from '@/router';
import emitter from '@/utils/event-bus.js'
import { userLogoutApi } from '@/api/user';
import { StealthStorage } from '@/utils/stealthStorage'


class WebSocketManager {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectInterval = 5000
    this.reconnectTimer = null
    this.isConnecting = false
    this.isManualClose = false  // 是否手动关闭
    this.hasLoggedFailOnce = false // 是否已提示过一次连接失败，避免刷屏
  }

  // 拼接 WebSocket 地址：优先用 VITE_WS_URL（生产经 nginx 注入真实 IP 头），否则按当前页面主机名 + 8800 端口（本地 dev 直连）
  getWsUrl(role, userId) {
    const wsHost = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8800`
    return `${wsHost}/websocket/${role}/${userId}`
  }

  // 清除待执行的重连定时器
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // 初始化 WebSocket 连接
  init(userId, role = 'user') { // 用户端默认 role='user'
    if (!userId) {
      console.warn('❌ 没有用户ID，无法初始化 WebSocket')
      return
    }

    
    // 重置手动关闭标志
    this.isManualClose = false

    // 如果正在连接或已连接，先关闭
    if (this.isConnecting || this.socket) {
      if (this.socket) {
        console.log('🔌 关闭现有连接，准备重新连接')
        this.socket.close()
        this.socket = null
      }
    }

    this.isConnecting = true
    this.hasLoggedFailOnce = false
    this.clearReconnectTimer()

    try {
      const wsUrl = this.getWsUrl(role, userId)
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log(`✅ WebSocket 连接成功，角色: ${role}，用户ID: ${userId}`)
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket 连接关闭:', event.code, event.reason)
        this.isConnecting = false
        this.socket = null
        // this.handleReconnect(userId)

        // 只在应该重连且不是手动关闭才重连
        if (this.shouldReconnectOnClose(event.code) && !this.isManualClose) {
            this.handleReconnect(userId, role)
        }
      }

      this.socket.onerror = () => {
        // 后台服务不可用时只提示一次，避免控制台刷屏；不影响页面请求，重连由 onclose 驱动
        if (!this.hasLoggedFailOnce) {
          this.hasLoggedFailOnce = true
          console.warn(`⚠️ WebSocket 连接失败（后台服务未启动或不可达）: ${wsUrl}，不影响页面请求，将自动重连`)
        }
        this.isConnecting = false
      }

    } catch (error) {
      console.error('❌ 创建 WebSocket 失败:', error)
      this.isConnecting = false
    }
  }
    // 判断是否应该重连
  shouldReconnectOnClose(code) {
    // 正常关闭，不重连
    if (code === 1000) return false
    
    // 1001：服务端主动关闭（如 Spring Boot 优雅停机），应重连
    // 注意：客户端 onclose 收到的 1001 来自服务端，表示"服务端要下线"，
    // 与浏览器导航离开时客户端发出的 1001 是不同的方向，与 dashboard 端保持一致

    // 1008：策略违规，可能是权限问题，不重连
    if (code === 1008) return false
    
    // 其他错误码（含 1006 连接异常断开），尝试重连
    return true
  }

  // 处理重连逻辑：固定间隔重试，最多重试 maxReconnectAttempts 次
  handleReconnect(userId, role) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 后台服务不可用，自动重连中 (第${this.reconnectAttempts}/${this.maxReconnectAttempts}次)，${this.reconnectInterval / 1000}s 后重试`)
      this.clearReconnectTimer()
      this.reconnectTimer = setTimeout(() => {
        this.init(userId, role)
      }, this.reconnectInterval)
    } else {
      console.warn('❌ 达到最大重连次数，停止重连')
    }
  }

  // 处理接收到的消息
  handleMessage(messageData) {
    try {

      // 1. 处理纯文本消息（定时任务结果等）
      if (typeof messageData === 'string' && !messageData.startsWith('{')) {
        // 🎯 定时任务结果消息，直接显示
        window.$snackbar?.success(messageData )
        return
    }

      // 2. 解析 JSON 数据
      const data = JSON.parse(messageData)
      console.log('📨 收到 WebSocket 消息:', data)

      // 3. 处理数组格式消息（评论、任务等）
      if (Array.isArray(data)) {
        this.handleArrayMessage(data)
        return
      }

      // 4. 处理对象格式消息（通知、在线用户列表等）
      this.handleObjectMessage(data)

    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error)
    }
  }

  // 处理数组格式消息
  handleArrayMessage(arr){
    const messageType = arr[0]

    switch (messageType) {
      case 'comment':  // 评论消息
        break
        
      case 'task':  // 任务消息
        break
        
      case 'system':  // 系统消息
        break
        
      default:
        // 未知类型的数组消息，尝试显示
        console.warn('未知的数组消息类型:', messageType, arr)
        if (arr.length > 1) {
          window.$snackbar?.success(String(arr[1]))
        }
    }
  }

  // 处理对象格式消息
  handleObjectMessage(data) {
      switch (data.type) {
        case 'force_logout':
          this.showForceLogoutDialog(data.title, data.message)
          break
        case 'password_changed':
          this.showPasswordChangedDialog(data.title, data.message)
          break
        case 'account_disabled':
          this.showAccountDisabledDialog(data.title, data.message)
          break
        case 'session_expired':
          this.showSessionExpiredDialog(data.title, data.message)
          break
        default:
          // 普通任务结果消息
          if (data.message) {
            window.$snackbar?.success(data.message)
            return
          }
          console.warn('未知的消息类型:', data.type)
      }
  }

  // 显示强制退出对话框
  showForceLogoutDialog(title, message) {
    const userStore = useUserStore()
    if (userStore.user) {
        userStore.user._k = true
    }
    StealthStorage.set('force_logout_pending', 'true')
    window.$dialog.alert({
      title: title,
      content: message,
      icon: 'mdi-alert',
      iconColor: 'error',
      confirmText: '重新登录',
      persistent: true,
      onConfirm: () => {
        // 用户点击确认，清除标记并执行退出
        StealthStorage.remove('force_logout_pending')
        this.logoutAndRedirect()
      }
    })
  }

  showPasswordChangedDialog(title, message) {
    window.$dialog.alert({
      title: title,
      content: message,
      icon: 'mdi-lock-reset',
      iconColor: 'warning',
      confirmText: '重新登录',
      persistent: true,
      onConfirm: () => {
        this.logoutAndRedirect()
      }
    })
  }

  showAccountDisabledDialog(title, message) {
    window.$dialog.alert({
      title: title,
      content: message,
      icon: 'mdi-account-off-outline',
      iconColor: 'error',
      confirmText: '确定',
      persistent: true,
      onConfirm: () => {
        this.logoutAndRedirect()
      }
    })
  }

  showSessionExpiredDialog(title, message) {
    window.$dialog.alert({
      title: title,
      content: message,
      icon: 'mdi-clock-alert-outline',
      iconColor: 'warning',
      confirmText: '重新登录',
      persistent: true,
      onConfirm: () => {
        this.logoutAndRedirect()
      }
    })
  }

  // 统一的退出和跳转
  async logoutAndRedirect() {
    await userLogoutApi()
    console.log("==================== 统一的退出和跳转 ====================")
    this.close()
    const userStore = useUserStore()
    // 清空用户所有数据
    userStore.clearUserStore()
    // 提示用户重新登录
    emitter.emit('loginDialogVisible',true)
    // 提示信息
    window.$snackbar?.error('请重新登录')
    router.replace('/')
  }

  // 检查并处理强退用户点击刷新标记
  async checkAndHandleForceLogout() {
    const pendingLogout = StealthStorage.get('force_logout_pending')
    const userStore = useUserStore()
    // pendingLogout === 'true' 处理用户刷新页面
    // userStore.user && userStore.user._k 处理用户关闭页面
    if (pendingLogout === 'true' || (userStore.user && userStore.user._k)) {
      StealthStorage.remove('force_logout_pending')
      await this.logoutAndRedirect()
      return true
    }
    return false
  }

  // 关闭 WebSocket 连接
  close() {
    // 连接正在建立或已建立，才需要关闭
    // readyState 小于 2 表示正在连接或已连接
    if (this.socket && this.socket.readyState < 2) {
      this.isManualClose = true  // 标记为手动关闭，防止重连
      console.log('🔌 手动关闭 WebSocket 连接')
      this.socket.close(1000, 'Manual close')
      this.socket = null
    }
    this.clearReconnectTimer()
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  // 获取连接状态
  getStatus() {
    if (!this.socket) return 'disconnected'
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'unknown'
    }
  }

  // 发送消息（如果需要的话）
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }
}

// 创建单例实例
const websocketManager = new WebSocketManager()

export default websocketManager