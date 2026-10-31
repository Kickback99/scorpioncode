import http from '@/utils/request'

/**
 * 获取用户配置
 * @param {Number} userId 用户 ID
 * @returns {Promise}
 */
export const getUserConfigApi = (userId) => http.get(`/admin/user/config/getAll?userId=${userId}`)

/**
 * 更新单个配置项
 * @param {Number} userId 用户 ID
 * @param {String} key 配置键
 * @param {String} value 配置值
 * @returns {Promise}
 */
export const updateUserConfigValueApi = (userId, key, value) => http.put('/admin/user/config/updateValue', { userId, key, value })

/**
 * 批量更新配置
 * @param {Number} userId 用户 ID
 * @param {Object} configMap 配置键值映射
 * @returns {Promise}
 */
export const batchUpdateUserConfigApi = (userId, configMap) => http.put('/admin/user/config/batchUpdate', { userId, configMap })

/**
 * 删除配置项
 * @param {Number} userId 用户 ID
 * @param {String} key 配置键
 * @returns {Promise}
 */
export const deleteUserConfigValueApi = (userId, key) => http.delete(`/admin/user/config/deleteValue?userId=${userId}&key=${key}`)
