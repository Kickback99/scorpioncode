import http from '@/utils/request'

/**
 * 分页查询友链列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const friendLinkListApi = (pageNum, pageSize, searchData) =>
  http.get(`/admin/content/friendLink/${pageNum}/${pageSize}`, { params: searchData })

/**
 * 新增友链
 * @param {Object} params 友链数据
 * @returns {Promise}
 */
export const friendLinkAddApi = (params) => http.post('/admin/content/friendLink',params)

/**
 * 修改友链
 * @param {Object} params 友链数据（含 id）
 * @returns {Promise}
 */
export const friendLinkModifyApi = (params) => http.put('/admin/content/friendLink',params)

/**
 * 删除友链
 * @param {Number|Number[]} ids 友链 ID 或 ID 数组
 * @returns {Promise}
 */
export const friendLinkRemoveApi = (ids) => http.delete(`/admin/content/friendLink/${ids}`)
