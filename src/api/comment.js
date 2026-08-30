// api/comment.js
import http from '@/utils/http'

/**
 * 获取文章评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Number} articleId 文章ID
 * @returns 
 */
export const getCommentsApi = (pageNum, pageSize, articleId) => 
  http.get(`/user/msg/comment/${pageNum}/${pageSize}`, { 
    params: { articleId } 
  })

/**
 * 添加文章评论
 * @param {Object} data 评论数据
 * @param {Number} data.articleId 文章ID
 * @param {String} data.content 评论内容
 * @param {String} data.type 评论类型（0文章评论，1友链评论）
 * @param {Number} [data.rootId] 根评论ID
 * @param {Number} [data.toCommentId] 回复的目标评论ID
 * @param {Number} [data.toCommentUserId] 回复的目标评论用户ID
 * @returns 
 */
export const addCommentApi = (data) => 
  http.post('/user/msg/comment/reply', data)

export const getChildCommentsApi = (commentId,pageNum,pageSize) =>
  http.get(`/user/msg/comment/child/${commentId}/${pageNum}/${pageSize}`)

export const deleteCommentApi = (id) => 
  http.delete(`/user/msg/comment/byId/${id}`)

/**
 * 获取友链评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @returns 
 */
export const getFriendLinkCommentApi = (pageNum, pageSize) => 
  http.get(`/user/msg/comment/friendLink/${pageNum}/${pageSize}`)

/**
 * 获取友链评论总数
 * @returns 
 */
export const getFriendLinkCommentCountApi = () => 
  http.get(`/user/msg/comment/friendLink/count`)