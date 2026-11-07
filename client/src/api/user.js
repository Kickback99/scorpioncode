import http from '@/utils/http'

/**
 * 用户登录
 * @param {Object} params 登录参数
 * @returns {Promise}
 */
export const userLoginApi = (params) => http.post('/user/login',params)

/**
 * 用户注册
 * @param {Object} params 请求参数，{ username, password, email, verifyCode }
 * @returns {Promise}
 */
export const userRegisterApi = (params) => http.post('/user/register',params)

/**
 * 忘记密码-重置密码
 * @param {Object} params 请求参数，{ email, verifyCode, newPassword, confirmPassword }
 * @returns {Promise}
 */
export const userPasswordResetApi = (params) => http.post('/user/password/reset',params)

/**
 * 注销账号
 * @param {Object} params 请求参数，{ verifyCode }
 * @returns {Promise}
 */
export const userCancelApi = (params) => http.post('/user/cancel',params)

/**
 * 修改密码
 * @param {Object} params 请求参数，{ oldPassword, newPassword, confirmPassword }
 * @returns {Promise}
 */
export const userChangePasswordApi = (params) => http.post('/user/changePassword',params)

/**
 * 查询用户详情，options 可传 axios config（如 { _quiet: true } 静默校验：401 时不弹窗不跳转）
 * @param {Object} options axios 配置
 * @returns {Promise}
 */
export const userInfoApi = (options = {}) => http.get('/user/userDetailInfo', options)

/**
 * 用户注销
 * @returns {Promise}
 */
export const userLogoutApi = () => http.get("/user/logout")

/**
 * 分页查询用户收藏列表
 * @param {Object} params 分页参数，{ pageNum, pageSize }
 * @returns {Promise}
 */
export const userFavoritesApi = (params) => {
  const pageNum = params?.pageNum || 1
  const pageSize = params?.pageSize || 9999
  return http.get(`/user/favorites/${pageNum}/${pageSize}`)
}

/**
 * 取消收藏
 * @param {Number} articleId 文章 ID
 * @returns {Promise}
 */
export const deleteFavoriteApi = (articleId) => http.delete(`/user/favorites/${articleId}`)

/**
 * 分页查询用户评论列表
 * @param {Object} params 分页参数，{ pageNum, pageSize }
 * @returns {Promise}
 */
export const getUserCommentsApi = (params) => {
  const pageNum = params?.pageNum || 1
  const pageSize = params?.pageSize || 9999
  return http.get(`/user/comments/${pageNum}/${pageSize}`)
}

/**
 * 删除用户评论
 * @param {Number} commentId 评论 ID
 * @returns {Promise}
 */
export const deleteCommentApi = (commentId) => {
  return http({
    url: `/user/userComment/${commentId}`,
    method: 'delete'
  })
}

/**
 * 修改用户基本资料
 * @param {Object} params 用户资料（含头像文件）
 * @returns {Promise}
 */
export const userUpdateInfoApi = (params) => {
    const formData = new FormData()
    for(const k in params){
        if(params[k] != null){
        formData.append(k,params[k])
        }
    }
    return http.put('/user/updateUserDetailInfo',formData,{ timeout: 35000 }) // 资料/头像上传超时 35 秒
}
