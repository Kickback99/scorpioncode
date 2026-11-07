import http from '@/utils/http'

/**
 * 生成验证码
 * @param {String} type 验证码类型（default-算术/chinese/english/number/mixed/gif/slider/click）
 * @returns {Promise}
 */
export const captchaGenerateApi = (type) => http.post('/user/captcha/generate', { type })

/**
 * 校验验证码
 * @param {Object} payload 校验请求（按类型填 answer / track / points）
 * @returns {Promise} 成功后返回一次性 verifyToken
 */
export const captchaVerifyApi = (payload) => http.post('/user/captcha/verify', payload)
