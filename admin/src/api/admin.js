import http from '@/utils/request'

/* export const userRegisterService = (registerData) =>{
    const params = new URLSearchParams();

    for(let key in registerData){
        params.append(key,registerData[key])
    }

    return http.post('/user/register',params)
} */

//用户登录
export const adminLoginApi = (params) =>{

    return http.post('/admin/login',params)


    /* const params = new URLSearchParams();

    for(let key in loginData){
        params.append(key,loginData[key])
    }

    return request.post('/user/login',params) */
}

// 获取用户信息
export const userInfoApi = () => {
    return http.get('/admin/userDetailInfo')
}

// 获取用户统计信息
export const userStatsApi = () => {
    return http.get('/admin/stats')
}

// 修改用户信息
export const userUpdateInfoApi = (params) => {
    const formData = new FormData()
    for(const k in params){
        if(params[k] != null){
        formData.append(k,params[k])
        }
    }
    return http.put('/admin/updateUserDetailInfo',formData)
}

// 修改用户密码
export const userUpdatePwdApi = (params) => {
    return http.patch('/admin/updateUserPwd',params)
}

// 用户退出登录
export const adminLogoutApi = () => {
    return http.get("/admin/logout")
}