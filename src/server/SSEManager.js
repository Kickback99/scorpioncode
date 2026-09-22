/**
 * SSE 管理器
 * 负责建立、维护 SSE 连接，支持消息监听、自动重连
 */
class SSEManager {
    constructor() {
        this.eventSource = null
        this.listeners = new Map() // 存储消息监听器
        this.status = 'disconnected' // disconnected | connecting | connected
        this.url = ''
    }

    /**
     * 建立 SSE 连接
     * @param {String} url SSE 接口地址
     * @param {Object} options 配置项
     * @param {Function} options.onMessage 消息回调
     * @param {Function} options.onOpen 连接打开回调
     * @param {Function} options.onError 错误回调
     * @param {Function} options.onClose 关闭回调
     * @returns {SSEManager}
     */
    connect(url, options = {}) {
        // 关闭已有连接
        this.disconnect()

        this.url = url
        this.status = 'connecting'

        try {
            this.eventSource = new EventSource(url)

            // 消息监听
            this.eventSource.onmessage = (event) => {
                this.status = 'connected'
                if (options.onMessage) {
                    options.onMessage(event.data)
                }
                // 触发自定义监听器
                this._triggerListeners('message', event.data)
            }

            // 连接打开
            this.eventSource.onopen = () => {
                this.status = 'connected'
                if (options.onOpen) {
                    options.onOpen()
                }
                this._triggerListeners('open')
            }

            // 错误（SSE 会自动重连）
            this.eventSource.onerror = (error) => {
                this.status = 'disconnected'
                if (options.onError) {
                    options.onError(error)
                }
                this._triggerListeners('error', error)
            }

            // 关闭事件（手动关闭时触发）
            // EventSource 没有 onclose，需要手动处理

        } catch (error) {
            this.status = 'disconnected'
            console.error('SSE 连接失败:', error)
            if (options.onError) {
                options.onError(error)
            }
        }

        return this
    }

    /**
     * 断开 SSE 连接
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }
        this.status = 'disconnected'
        this._triggerListeners('close')
    }

    /**
     * 注册自定义监听器
     * @param {String} event 事件名: message | open | error | close
     * @param {Function} callback 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)
        return this
    }

    /**
     * 移除监听器
     * @param {String} event 事件名
     * @param {Function} callback 回调函数（不传则移除该事件所有监听）
     */
    off(event, callback) {
        if (!callback) {
            this.listeners.delete(event)
            return this
        }
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
        return this
    }

    /**
     * 获取连接状态
     * @returns {String} disconnected | connecting | connected
     */
    getStatus() {
        return this.status
    }

    /**
     * 是否已连接
     * @returns {Boolean}
     */
    isConnected() {
        return this.status === 'connected'
    }

    /**
     * 触发内部监听器
     * @private
     */
    _triggerListeners(event, data) {
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            callbacks.forEach(cb => cb(data))
        }
    }
}

// 导出单例
export default new SSEManager()