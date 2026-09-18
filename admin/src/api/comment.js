// api/comment.js
import http from '@/utils/request'

/**
 * 获取评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Number} articleId 文章ID
 * @returns 
 */
export const getCommentsApi = (pageNum, pageSize, searchData) => 
  http.get(`/admin/msg/comment/${pageNum}/${pageSize}`, { 
    params: searchData
  })


/**
 * 添加评论
 * @param {Object} data 评论数据
 * @param {Number} data.articleId 文章ID
 * @param {String} data.content 评论内容
 * @param {String} data.type 评论类型（0文章评论，1友链评论）
 * @param {Number} [data.rootId] 根评论ID
 * @param {Number} [data.toCommentId] 回复的目标评论ID
 * @param {Number} [data.toCommentUserId] 回复的目标评论用户ID
 * @returns 
 */
export const addCommentApi = ( data ) => 
  http.post('/admin/msg/comment', data)


// 根据ID获取单个评论
export const getCommentByIdApi = (id) => 
  http.get(`/admin/msg/comment/${id}`)


/**
 * 
 * @param {ids} ids 评论ids
 * @returns 
 */
export const removeCommentApi = (ids) =>
http.delete(`/admin/msg/comment/${ids}`)



// 批量审核（通过/驳回）
export const auditCommentsApi = (ids, status) => {
  return http({
      url: `/admin/msg/comment/audit?status=${status}`,
      method: 'put',
      data: ids
  })
}

// 单个审核
export const auditCommentApi = (id, status) => {
  return http({
      url: `/admin/msg/comment/audit/${id}/${status}`,
      method: 'put'
  })
}

/**
 * 获取评论统计数据
 * @param {Object} params - 查询参数（与列表查询参数一致）
 * @returns {Promise} 返回统计数据 { total, pending, approved, rejected }
 */
export const getCommentStatisticsApi = (params) => {
  return http({
      url: '/admin/msg/comment/statistics',
      method: 'get',
      params
  })
}