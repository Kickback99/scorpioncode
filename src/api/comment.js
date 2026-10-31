import http from '@/utils/request'

/**
 * 分页查询评论列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @param {Object} searchData 查询条件
 * @returns {Promise}
 */
export const getCommentsApi = (pageNum, pageSize, searchData) =>
  http.get(`/admin/msg/comment/${pageNum}/${pageSize}`, {
    params: searchData
  })

/**
 * 添加评论
 * @param {Object} data 评论数据
 * @param {Number} data.articleId 文章 ID
 * @param {String} data.content 评论内容
 * @param {String} data.type 评论类型（0 文章评论，1 友链评论）
 * @param {Number} [data.rootId] 根评论 ID
 * @param {Number} [data.toCommentId] 回复的目标评论 ID
 * @param {Number} [data.toCommentUserId] 回复的目标评论用户 ID
 * @returns {Promise}
 */
export const addCommentApi = ( data ) =>
  http.post('/admin/msg/comment', data)

/**
 * 根据 ID 查询单个评论
 * @param {Number} id 评论 ID
 * @returns {Promise}
 */
export const getCommentByIdApi = (id) =>
  http.get(`/admin/msg/comment/${id}`)

/**
 * 删除评论
 * @param {Number|Number[]} ids 评论 ID 或 ID 数组
 * @returns {Promise}
 */
export const removeCommentApi = (ids) =>
http.delete(`/admin/msg/comment/${ids}`)

/**
 * 批量审核评论（通过/驳回）
 * @param {Number[]} ids 评论 ID 数组
 * @param {Number} status 审核状态
 * @returns {Promise}
 */
export const auditCommentsApi = (ids, status) => {
  return http({
      url: `/admin/msg/comment/audit?status=${status}`,
      method: 'put',
      data: ids
  })
}

/**
 * 单个审核评论
 * @param {Number} id 评论 ID
 * @param {Number} status 审核状态
 * @returns {Promise}
 */
export const auditCommentApi = (id, status) => {
  return http({
      url: `/admin/msg/comment/audit/${id}/${status}`,
      method: 'put'
  })
}

/**
 * 获取评论统计数据
 * @param {Object} params 查询参数（与列表查询参数一致）
 * @returns {Promise} 统计数据 { total, pending, approved, rejected }
 */
export const getCommentStatisticsApi = (params) => {
  return http({
      url: '/admin/msg/comment/statistics',
      method: 'get',
      params
  })
}
