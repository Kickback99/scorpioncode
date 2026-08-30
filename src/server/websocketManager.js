import { ElMessageBox } from 'element-plus'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import router from '@/router';
import { useConfigStore } from '@/store/config';
import msg from '@/components/msg'

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
    this.cachedOnlineUsers = null  // 缓存在线用户
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
  init(userId, role = 'admin') { // 管理端默认 role='admin'
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
        // console.log(`✅ WebSocket 连接成功，角色: ${role}，用户ID: ${userId}`)
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

  getSocket() {
        return this.socket
  }

    // 判断是否应该重连
  shouldReconnectOnClose(code) {
    // 1000：正常关闭，不重连
    if (code === 1000) return false

    // 1001：服务端主动关闭（如 Spring Boot 优雅停机），应重连
    // 注意：客户端 onclose 收到的 1001 来自服务端，表示"服务端要下线"，
    // 与浏览器导航离开时客户端发出的 1001 是不同的方向
    // 不在此处拦截，让其进入重连流程

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

  // 处理接收到的消息（兼容 string、JSON对象、JSON数组）
  handleMessage(messageData) {
    try {
      // 1. 处理纯文本消息（定时任务结果等）
      if (typeof messageData === 'string' && !messageData.startsWith('{') && !messageData.startsWith('[')) {
        // sendMessage，直接显示(目前有定时任务、强退用户的操作结果反馈：用户主动操作/心跳拦截)
        msg.primary({
          message: messageData.replace(/\n/g, '<br><br>'),
          dangerouslyUseHTMLString: true,
          duration: 5000,  // 消息显示时间长一点
          customClass: 'message-right-top'
        })
        return
      }

      // 2. 解析 JSON 数据
      const data = JSON.parse(messageData)
      console.log('==================== websocket 数据 ====================', data)

      // 3. 处理数组格式消息（评论、任务等）
      if (Array.isArray(data)) {
        this.handleArrayMessage(data)
        return
      }

      // 4. 处理对象格式消息（通知、在线用户列表等）
      this.handleObjectMessage(data)
      
    } catch (error) {
      console.error('❌ 解析 WebSocket 消息失败:', error)
    }
  }

  // 处理数组格式消息
  handleArrayMessage(arr) {
    // 数组格式：[type, data1, data2, ...]
    const messageType = arr[0]
    
    switch (messageType) {
      case 'comment':  // 评论消息

        // 获取配置 store
        const configStore = useConfigStore()
        // 检查评论通知是否开启
        if (!configStore.getNotificationCommentEnabled()) {
          return
        }
        
        const commentUser = arr[1]  // 评论人
        const commentContent = arr[2]  // 评论内容
        // 格式：评论人：\n评论内容
        const commentMessage = `${commentUser} 发来了评论：<br><br>${commentContent}`
        msg.primary({
          message: commentMessage,
          dangerouslyUseHTMLString: true,
          duration: 5000,  // 评论消息显示时间长一点
          customClass: 'message-right-top'
        })
        break
        
      case 'task':  // 任务消息
        const taskTitle = arr[1]
        const taskContent = arr[2]
        const taskMessage = `${taskTitle}\n${taskContent}`
        msg.primary({
          message: taskMessage,
          dangerouslyUseHTMLString: true
        })
        break
        
      case 'system':  // 系统消息
        const systemMsg = arr[1]
        msg.primary({
          message: systemMsg,
          dangerouslyUseHTMLString: true
        })
        break
      
      case 'carousel':
        const carouselStatus = arr[1]    // SUCCESS 或 FAILED
        const carouselMessage = arr[2]   // 消息内容
        const businessId = arr[3]        // 轮播ID
        // 进度消息
        if (carouselStatus === 'PROGRESS') {
            const progress = parseInt(carouselMessage)
            window.dispatchEvent(new CustomEvent('carousel-upload-progress', {
                detail: { carouselId: businessId, progress: progress }
            }))
            return
        }

        if (carouselStatus === 'SUCCESS') {
          // 上传成功
          window.dispatchEvent(new CustomEvent('carousel-upload-complete', {
            detail: { message: carouselMessage, carouselId: businessId }
          }))
        }else if (carouselStatus === 'FAILED') {
          // 上传失败
          window.dispatchEvent(new CustomEvent('carousel-upload-failed', {
            detail: { message: carouselMessage, carouselId: businessId }
          }))
        }
        break

      case 'notice':
        const noticeId = arr[1]
        const noticeTitle = arr[2]
        // 触发全局事件，NoticeBell 组件监听此事件更新未读数
        window.dispatchEvent(new CustomEvent('notice-push', {
          detail: { noticeId, title: noticeTitle }
        }))
        break

      default:
        // 未知类型的数组消息，尝试显示
        console.warn('未知的数组消息类型:', messageType, arr)
        if (arr.length > 1) {
          msg.primary(String(arr[1]))
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
      case 'online_users_update':
        // 缓存数据
        this.cachedOnlineUsers = data
        // console.log('缓存在线用户数据:', data)
        // 触发全局事件
        window.dispatchEvent(new CustomEvent('online-users-update', {
            detail: data
        }))
        break
      case 'permission_changed':
        // 权限变更推送：管理员调整角色权限后，实时刷新按钮与操作列显隐
        useUserStore().setUserPerm(data.permissions)
        break
      default:
        // 普通任务结果消息
        if (data.message) {
          msg.primary(data.message)
          return
        }
        console.warn('未知的消息类型:', data.type)
    }
  }

  // 获取缓存
  getCachedOnlineUsers() {
      return this.cachedOnlineUsers
  }

  // 显示强制退出对话框
  showForceLogoutDialog(title, message) {
    ElMessageBox.alert(message, title, {
      confirmButtonText: '重新登录',
      callback: () => {
        this.logoutAndRedirect()
      }
    })
  }

  showPasswordChangedDialog(title, message) {
    ElMessageBox.alert(message, title, {
      confirmButtonText: '重新登录',
      callback: () => {
        this.logoutAndRedirect()
      }
    })
  }

  showAccountDisabledDialog(title, message) {
    ElMessageBox.alert(message, title, {
      confirmButtonText: '确定',
      callback: () => {
        this.logoutAndRedirect()
      }
    })
  }

  showSessionExpiredDialog(title, message) {
    ElMessageBox.alert(message, title, {
      confirmButtonText: '重新登录',
      callback: () => {
        this.logoutAndRedirect()
      }
    })
  }

  // 统一的退出和跳转
  logoutAndRedirect() {
    this.close()
    
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    
    tokenStore.removeToken()
    userStore.clearUserStore()
    router.push('/login')
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