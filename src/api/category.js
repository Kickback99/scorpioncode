import http from '@/utils/request'

const API = {
    CATEGORY_URL : '/admin/blog/category',
}

/**
 * 新增分类
 * @param {Object} params 分类数据
 * @returns {Promise}
 */
export const addApi = (params) => http.post(API.CATEGORY_URL,params)

/**
 * 删除分类
 * @param {Number} params 分类 ID
 * @returns {Promise}
 */
export const removeApi = (params) => http.delete(`${API.CATEGORY_URL}/${params}`)

/**
 * 修改分类
 * @param {Object} params 分类数据
 * @returns {Promise}
 */
export const modifyApi = (params) => http.put(API.CATEGORY_URL,params)

/**
 * 查询分类列表
 * @param {Array} params 分类 ID 集合
 * @returns {Promise}
 */
export const listApi = (params) => http.get(`${API.CATEGORY_URL}`,{params:{cateIds:params}})
