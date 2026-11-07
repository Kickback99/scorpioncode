import http from '@/utils/request'

/**
 * 生成验证码
 * @param {String} type 验证码类型（default-算术/chinese/english/number/mixed/gif/slider/click）
 * @returns {Promise}
 */
export const captchaGenerateApi = (type) => http.post('/admin/captcha/generate', { type })

/**
 * 校验验证码
 * @param {Object} payload 校验请求（按类型填 answer / track / points）
 * @returns {Promise} 成功后返回一次性 verifyToken
 */
export const captchaVerifyApi = (payload) => http.post('/admin/captcha/verify', payload)

/**
 * 查询管理端验证码配置（匿名，登录页动态读取类型与总开关）
 * @returns {Promise} 返回 { enabled, type }
 */
export const getAdminCaptchaConfigApi = () => http.get('/admin/captcha/config')
