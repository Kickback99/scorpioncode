import http from '@/utils/http'

/**
 * 查询友链列表
 * @param {*} pageNum 页码
 * @param {*} pageSize 每页大小
 * @returns 
 */
export function getClientFriendLinkListApi(pageNum, pageSize) {
  return http({
    url: `/user/content/friendLink/${pageNum}/${pageSize}`,
    method: 'get'
  })
}