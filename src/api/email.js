import http from '@/utils/http'

/**
 * 发送邮箱验证码
 * @param {Object} params 请求参数，{ email: 邮箱, type: 验证码类型(register-注册, forgot-忘记密码) }
 * @returns {Promise}
 */
export const emailCodeSendApi = (params) => http.post('/user/email/code', params)
