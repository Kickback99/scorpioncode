import http from '@/utils/http'

/**
 * 获取文章评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const getCommentsApi = (pageNum, pageSize, articleId) =>
  http.get(`/user/msg/comment/${pageNum}/${pageSize}`, {
    params: { articleId }
  })

/**
 * 添加文章评论
 * @param {Object} data 评论数据
 * @param {Number} data.articleId 文章 ID
 * @param {String} data.content 评论内容
 * @param {String} data.type 评论类型（0 文章评论，1 友链评论）
 * @param {Number} [data.rootId] 根评论 ID
 * @param {Number} [data.toCommentId] 回复的目标评论 ID
 * @param {Number} [data.toCommentUserId] 回复的目标评论用户 ID
 * @returns {Promise}
 */
export const addCommentApi = (data) =>
  http.post('/user/msg/comment/reply', data)

/**
 * 获取子评论列表
 * @param {Number} commentId 根评论 ID
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise}
 */
export const getChildCommentsApi = (commentId,pageNum,pageSize) =>
  http.get(`/user/msg/comment/child/${commentId}/${pageNum}/${pageSize}`)

/**
 * 删除评论
 * @param {Number} id 评论 ID
 * @returns {Promise}
 */
export const deleteCommentApi = (id) =>
  http.delete(`/user/msg/comment/byId/${id}`)

/**
 * 获取友链评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise}
 */
export const getFriendLinkCommentApi = (pageNum, pageSize) =>
  http.get(`/user/msg/comment/friendLink/${pageNum}/${pageSize}`)

/**
 * 获取友链评论总数
 * @returns {Promise}
 */
export const getFriendLinkCommentCountApi = () =>
  http.get(`/user/msg/comment/friendLink/count`)
