import http from '@/utils/request'

/**
 * 新增菜单
 * @param {Object} params 菜单数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post('/admin/system/menus',params)

/**
 * 删除菜单
 * @param {Number|Number[]} ids 菜单 ID 或 ID 数组
 * @returns {Promise}
 */
export const removeApi  = (ids) => http.delete(`/admin/system/menus/${ids}`)

/**
 * 修改菜单
 * @param {Object} params 菜单数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put('/admin/system/menus',params)

/**
 * 查询全部菜单
 * @returns {Promise}
 */
export const listApi = () => http.get(`/admin/system/menus`)

/**
 * 修改菜单状态
 * @param {Number} id 菜单 ID
 * @param {Number} status 状态
 * @returns {Promise}
 */
export const statusApi = (id,status) => http.get(`/admin/system/menus/${id}`,{params:{status}})

/**
 * 获取角色菜单数据
 * @param {Number} roleId 角色 ID
 * @returns {Promise}
 */
export const allocMenusApi = (roleId) => http.get(`/admin/system/menus/assign/${roleId}`)

/**
 * 给角色分配菜单
 * @param {Object} roleMenuData 角色菜单数据
 * @returns {Promise}
 */
export const doAllocMenusApi = (roleMenuData) => http.post(`/admin/system/menus/assign`,roleMenuData)
