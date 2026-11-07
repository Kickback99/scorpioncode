import http from '@/utils/request'

/**
 * 新增用户
 * @param {Object} params 用户数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post('/admin/system/users',params)

/**
 * 删除用户
 * @param {Number|Number[]} ids 用户 ID 或 ID 数组
 * @returns {Promise}
 */
export const removeApi  = (ids) => http.delete(`/admin/system/users/${ids}`)

/**
 * 修改用户
 * @param {Object} params 用户数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put('/admin/system/users',params)

/**
 * 分页查询用户列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const listApi = (pageNum,pageSize,searchData) => http.get(`/admin/system/users/${pageNum}/${pageSize}`,{params:searchData})
// export const listApi = (params) => http.get(`/admin/system/users/${params.pageNum}/${params.pageSize}`,{params:{roleName:params.roleName}})

/**
 * 修改用户状态
 * @param {Number} id 用户 ID
 * @param {Number} status 状态
 * @returns {Promise}
 */
export const statusApi = (id,status) => http.get(`/admin/system/users/${id}`,{params:{status}})

/**
 * 获取用户详情（含角色 ID 列表）
 * @param {Number} id 用户 ID
 * @returns {Promise}
 */
export const getDetailApi = (id) => http.get(`/admin/system/users/detail/${id}`)
