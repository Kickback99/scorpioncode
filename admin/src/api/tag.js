import http from '@/utils/request'

const API = {
    TAG_URL : '/admin/blog/tag',
}

/**
 * 新增标签
 * @param {Object} params 标签数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post(API.TAG_URL,params)

/**
 * 删除标签
 * @param {Number} params 标签 ID
 * @returns {Promise}
 */
export const removeApi = (params) => http.delete(`${API.TAG_URL}/${params}`)

/**
 * 修改标签
 * @param {Object} params 标签数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put(API.TAG_URL,params)

/**
 * 分页查询标签列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const listApi = (pageNum,pageSize,searchData) => http.get(`${API.TAG_URL}/${pageNum}/${pageSize}`,{params:searchData})
