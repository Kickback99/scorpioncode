import http from '@/utils/request'

/**
 * 查询公告列表
 * @returns {Promise}
 */
export const noticeListApi = (pageNum,pageSize,searchData) => http.get(`/admin/msg/notice/list/${pageNum}/${pageSize}`,{params:searchData})

/**
 * 新增公告
 * @param {Object} params 公告数据 { title, content, type, isCurrent }
 * @returns {Promise}
 */
export const noticeAddApi = (params) => http.post('/admin/msg/notice/add', params)

/**
 * 修改公告
 * @param {Object} params 公告数据 { id, title, content, type, isCurrent }
 * @returns {Promise}
 */
export const noticeUpdateApi = (params) => http.put('/admin/msg/notice/update', params)

/**
 * 删除公告
 * @param {Number|Number[]} ids 公告 ID 或 ID 数组
 * @returns {Promise}
 */
export const noticeRemoveApi = (ids) => http.delete(`/admin/msg/notice/delete/${ids}`)

/**
 * 上架公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export const noticeOnlineApi = (id) => http.put(`/admin/msg/notice/online/${id}`)

/**
 * 下架公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export const noticeOfflineApi = (id) => http.put(`/admin/msg/notice/offline/${id}`)

/**
 * 推送公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export const noticePushApi = (id) => http.post(`/admin/msg/notice/push/${id}`)

/**
 * 获取当前用户未读公告列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页条数
 * @returns {Promise}
 */
export const noticeUnreadListApi = (pageNum, pageSize) =>
  http.get(`/admin/msg/notice/unread/list/${pageNum}/${pageSize}`)

/**
 * 标记公告已读
 * @param {Number} noticeId 公告ID
 * @returns {Promise}
 */
export const noticeMarkReadApi = (noticeId) =>
  http.put(`/admin/msg/notice/unread/read/${noticeId}`)

/**
 * 一键全部已读
 * @returns {Promise}
 */
export const noticeMarkAllReadApi = () =>
  http.delete('/admin/msg/notice/unread/all')

/**
 * 获取未读公告数量
 * @returns {Promise}
 */
export const noticeUnreadCountApi = () =>
  http.get('/admin/msg/notice/unread/count')

/**
 * 获取已读公告列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页条数
 * @returns {Promise}
 */
export const noticeReadListApi = (pageNum, pageSize) =>
  http.get(`/admin/msg/notice/read/list/${pageNum}/${pageSize}`)

/**
 * 获取公告详情（含推送目标用户）
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export const noticeDetailApi = (id) =>
  http.get(`/admin/msg/notice/detail/${id}`)

// 公告图片上传
export const noticeUploadApi = (formData) => http.post('/admin/upload/notice', formData, {
  timeout: 15000 //本次公告图上传请求超时15秒
})