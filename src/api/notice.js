import http from '@/utils/http'
import sseManager from '@/server/SSEManager'

/**
 * 获取当前展示的公告列表（包含类型信息）
 * @returns {Promise<Array>}
 */
export const getCurrentNoticeListApi = () => http.get('/client/notice/current/list')

/**
 * 建立 SSE 连接，接收实时公告推送（用户端）
 * @param {Function} onMessage 收到消息时的回调
 * @param {Function} onError 错误回调
 * @param {Function} onOpen 连接建立回调（首次连接与自动重连均会触发）
 * @returns {SSEManager}
 */
export const connectNoticeSSE = (onMessage, onError, onOpen) => {
    // 获取 SSE 接口地址
    const baseUrl = import.meta.env.VITE_API || ''
    const sseUrl = `${baseUrl}/client/notice/sse`

    return sseManager.connect(sseUrl, {
        onMessage: (data) => {
            // 收到公告，回调给业务层
            if (onMessage) {
                onMessage(data || '暂无公告')
            }
        },
        onError: (error) => {
            console.error('公告 SSE 连接异常:', error)
            if (onError) {
                onError(error)
            }
        },
        onOpen: () => {
            console.log('公告 SSE 连接已建立')
            if (onOpen) {
                onOpen()
            }
        }
    })
}

/**
 * 断开公告 SSE 连接
 */
export const disconnectNoticeSSE = () => {
    sseManager.disconnect()
}

/**
 * 获取 SSE 连接状态
 * @returns {String}
 */
export const getSSEStatus = () => {
    return sseManager.getStatus()
}