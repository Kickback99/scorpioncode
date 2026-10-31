import http from '@/utils/request'

/**
 * 新增角色
 * @param {Object} params 角色数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post('/admin/system/roles',params)

/**
 * 删除角色
 * @param {Number|Number[]} ids 角色 ID 或 ID 数组
 * @returns {Promise}
 */
export const removeApi  = (ids) => http.delete(`/admin/system/roles/${ids}`)

/**
 * 修改角色
 * @param {Object} params 角色数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put('/admin/system/roles',params)

/**
 * 分页查询角色列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const listApi = (pageNum,pageSize,searchData) => http.get(`/admin/system/roles/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 获取用户角色数据
 * @param {Number} userId 用户 ID
 * @returns {Promise}
 */
export const allocRolesApi = (userId) => http.get(`/admin/system/roles/assign/${userId}`)

/**
 * 给用户分配角色
 * @param {Object} userRoleData 用户角色数据
 * @returns {Promise}
 */
export const doAllocRolesApi = (userRoleData) => http.post(`/admin/system/roles/assign`,userRoleData)

/**
 * 获取角色详情（含用户 ID 列表）
 * @param {Number} id 角色 ID
 * @returns {Promise}
 */
export const getDetailApi = (id) => http.get(`/admin/system/roles/detail/${id}`)
