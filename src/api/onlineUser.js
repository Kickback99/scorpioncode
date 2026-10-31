import http from '@/utils/request'

/**
 * 查询在线用户列表
 * @returns {Promise}
 */
export const getOnlineListApi = () => http.get('/admin/online/list')

/**
 * 强退指定用户
 * @param {Number} userId 用户 ID
 * @param {String} role 用户角色
 * @returns {Promise}
 */
export const kickUserApi = (userId, role) => http.delete(`/admin/online/kick/${userId}/${role}`)

/**
 * 清理僵尸会话
 * @returns {Promise}
 */
export const cleanZombieApi = () => http.delete('/admin/online/clean')
