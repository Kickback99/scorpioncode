import http from '@/utils/http'

/**
 * 获取所有分类
 * @returns {Promise}
 */
export const cateListApi = () => http.get('/user/blog/category')

/**
 * 分页查询文章列表
 * @param {Object} params 分页与查询参数，{ pageNum, pageSize, searchData }
 * @returns {Promise}
 */
export const articleListApi = (params) => {
  const pageNum = params?.pageNum || 1
  const pageSize = params?.pageSize || 10
  const searchData = params?.searchData || {}
  return http.get(`/user/blog/article/${pageNum}/${pageSize}`, { params: searchData })
}

/**
 * 获取热门文章
 * @returns {Promise}
 */
export const hotListApi = () => http.get('/user/blog/article/hot')

/**
 * 获取最新文章
 * @returns {Promise}
 */
export const latestListApi = () => http.get('/user/blog/article/latest')

/**
 * 获取所有标签
 * @returns {Promise}
 */
export const tagListApi = () => http.get('/user/blog/tag')

/**
 * 查询文章详情
 * @param {String|Number} param 文章 ID
 * @returns {Promise}
 */
export const articleDetailApi = (param) => http.get(`/user/blog/article/detail/${param}`)

/**
 * 切换收藏状态
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const toggleFavoriteApi = (articleId) => http.post(`/user/favorite/toggle/${articleId}`)

/**
 * 更新文章浏览量到 Redis
 * @param {Number} id 文章 ID
 * @returns {Promise}
 */
export const updateViewCountApi = (id) => http.put(`/user/blog/article/updateViewCount/${id}`)
