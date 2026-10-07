import http from '@/utils/request'

// t_menu_api：菜单管理

// 新增菜单
export const addApi = (params) => http.post('/admin/system/menus',params)


// 删除菜单
export const removeApi  = (ids) => http.delete(`/admin/system/menus/${ids}`)


// 修改菜单
export const modifyApi = (params) => http.put('/admin/system/menus',params)


// 查询全部菜单
export const listApi = () => http.get(`/admin/system/menus`)

// 修改菜单状态
export const statusApi = (id,status) => http.get(`/admin/system/menus/${id}`,{params:{status}})


// 获取角色菜单数据
export const allocMenusApi = (roleId) => http.get(`/admin/system/menus/assign/${roleId}`)

// 给角色分配菜单
export const doAllocMenusApi = (roleMenuData) => http.post(`/admin/system/menus/assign`,roleMenuData)