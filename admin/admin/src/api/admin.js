import http from '@/utils/request'

/**
 * 管理员登录
 * @param {Object} params 登录参数
 * @returns {Promise}
 */
export const adminLoginApi = (params) =>{
    return http.post('/admin/login',params)
}

/**
 * 获取用户信息
 * @returns {Promise}
 */
export const userInfoApi = () => {
    return http.get('/admin/userDetailInfo')
}

/**
 * 获取用户统计信息
 * @returns {Promise}
 */
export const userStatsApi = () => {
    return http.get('/admin/stats')
}

/**
 * 修改用户信息
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
    return http.put('/admin/updateUserDetailInfo',formData,{ timeout: 35000 }) // 资料/头像上传超时 35 秒
}

/**
 * 修改用户密码
 * @param {Object} params 密码参数
 * @returns {Promise}
 */
export const userUpdatePwdApi = (params) => {
    return http.patch('/admin/updateUserPwd',params)
}

/**
 * 用户退出登录
 * @returns {Promise}
 */
export const adminLogoutApi = () => {
    return http.get("/admin/logout")
}
