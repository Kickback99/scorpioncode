import http from '@/utils/http'

/**
 * 查询友链列表
 * @param {Number} pageNum 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise}
 */
export function getClientFriendLinkListApi(pageNum, pageSize) {
  return http({
    url: `/user/blog/friendLink/${pageNum}/${pageSize}`,
    method: 'get'
  })
}
