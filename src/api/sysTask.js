import request from '@/utils/request'

const commonApi = 'admin/system/task'

// 查询所有任务列表
export const listApi = () => request.get(`${commonApi}/list`)

// 根据ID查询任务
export const getByIdApi = (id) => request.get(`${commonApi}/${id}`)

// 根据任务编码查询任务
export const getByCodeApi = (taskCode) => request.get(`${commonApi}/code/${taskCode}`)

// 新增任务
export const addApi = (data) => request.post(`${commonApi}/add`, data)

// 更新任务（只更新cron表达式）
export const updateApi = (id, data) => request.put(`${commonApi}/${id}`, data)

// 立即执行任务
export const executeApi = (taskCode) => request.post(`${commonApi}/execute/${taskCode}`)

// 刷新单个任务
export const refreshTaskApi = (taskCode) => request.post(`${commonApi}/refresh/${taskCode}`)

// 刷新所有任务
export const refreshAllApi = () => request.post(`${commonApi}/refresh-all`)

// 删除任务
export const deleteApi = (id) => request.delete(`${commonApi}/${id}`)