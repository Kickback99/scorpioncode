// src/api/userConfig.js
import http from '@/utils/request'

// 获取用户配置
export const getUserConfigApi = (userId) => http.get(`/admin/user/config/getAll?userId=${userId}`)

// 更新单个配置项
export const updateUserConfigValueApi = (userId, key, value) => http.put('/admin/user/config/updateValue', { userId, key, value })

// 批量更新配置
export const batchUpdateUserConfigApi = (userId, configMap) => http.put('/admin/user/config/batchUpdate', { userId, configMap })

// 删除配置项
export const deleteUserConfigValueApi = (userId, key) => http.delete(`/admin/user/config/deleteValue?userId=${userId}&key=${key}`)