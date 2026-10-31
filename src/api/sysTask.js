import request from '@/utils/request'

const commonApi = 'admin/system/task'

/**
 * 查询所有任务列表
 * @returns {Promise}
 */
export const listApi = () => request.get(`${commonApi}/list`)

/**
 * 根据 ID 查询任务
 * @param {Number} id 任务 ID
 * @returns {Promise}
 */
export const getByIdApi = (id) => request.get(`${commonApi}/${id}`)

/**
 * 根据任务编码查询任务
 * @param {String} taskCode 任务编码
 * @returns {Promise}
 */
export const getByCodeApi = (taskCode) => request.get(`${commonApi}/code/${taskCode}`)

/**
 * 新增任务
 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export const addApi = (data) => request.post(`${commonApi}/add`, data)

/**
 * 更新任务（仅 cron 表达式）
 * @param {Number} id 任务 ID
 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export const updateApi = (id, data) => request.put(`${commonApi}/${id}`, data)

/**
 * 立即执行任务
 * @param {String} taskCode 任务编码
 * @returns {Promise}
 */
export const executeApi = (taskCode) => request.post(`${commonApi}/execute/${taskCode}`)

/**
 * 刷新单个任务
 * @param {String} taskCode 任务编码
 * @returns {Promise}
 */
export const refreshTaskApi = (taskCode) => request.post(`${commonApi}/refresh/${taskCode}`)

/**
 * 刷新所有任务
 * @returns {Promise}
 */
export const refreshAllApi = () => request.post(`${commonApi}/refresh-all`)

/**
 * 删除任务
 * @param {Number} id 任务 ID
 * @returns {Promise}
 */
export const deleteApi = (id) => request.delete(`${commonApi}/${id}`)
