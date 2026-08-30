import http from '@/utils/request'

// t_role_api：角色管理

// 新增角色
export const addApi = (params) => http.post('/admin/system/roles',params)


// 删除角色
export const removeApi  = (ids) => http.delete(`/admin/system/roles/${ids}`)


// 修改角色
export const modifyApi = (params) => http.put('/admin/system/roles',params)


// 分页查询全部角色
export const listApi = (pageNum,pageSize,searchData) => http.get(`/admin/system/roles/${pageNum}/${pageSize}`,{params:searchData})


// 获取用户角色数据
export const allocRolesApi = (userId) => http.get(`/admin/system/roles/assign/${userId}`)

// 给用户分配角色
export const doAllocRolesApi = (userRoleData) => http.post(`/admin/system/roles/assign`,userRoleData)

/**
 * 获取角色详情（含用户ID列表）
 * @param {Number} id 角色ID
 * @returns {Promise}
 */
export const getDetailApi = (id) => http.get(`/admin/system/roles/detail/${id}`)

