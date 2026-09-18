import http from '@/utils/request'

// t_user_api：用户管理

// 新增用户
export const addApi = (params) => http.post('/admin/system/users',params)


// 删除用户
export const removeApi  = (ids) => http.delete(`/admin/system/users/${ids}`)


// 修改用户
export const modifyApi = (params) => http.put('/admin/system/users',params)


// 分页查询全部用户
export const listApi = (pageNum,pageSize,searchData) => http.get(`/admin/system/users/${pageNum}/${pageSize}`,{params:searchData})
// export const listApi = (params) => http.get(`/admin/system/users/${params.pageNum}/${params.pageSize}`,{params:{roleName:params.roleName}})

// 修改用户状态
export const statusApi = (id,status) => http.get(`/admin/system/users/${id}`,{params:{status}})

/**
 * 获取用户详情（含角色ID列表）
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export const getDetailApi = (id) => http.get(`/admin/system/users/detail/${id}`)


