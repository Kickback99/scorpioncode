//定制请求的实例

//导入axios  npm install axios
import { useUserStore } from '@/store/user';
import axios from 'axios';
import { isCookieMode } from '@/utils/auth'
//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = import.meta.env.VITE_API;
// withCredentials：cookie 模式下跨域请求携带 HttpOnly Cookie（同源请求无影响）
const instance = axios.create({baseURL,timeout:15000,withCredentials:true})
import router from '@/router';

import {isAuthRequired} from '@/api/authRequired'
import { useWebSocket } from '@/server/useWebSocket.js'
// 关闭 WebSocket（修改密码/注销后断开连接，与 Header 的 handleLogout 保持一致）
const { closeWebSocket } = useWebSocket()


//添加请求拦截器
instance.interceptors.request.use(
    config => {
        const userStore = useUserStore()
        // 根据路径判断是否需要携带 token（cookie 模式由浏览器自动携带 HttpOnly Cookie）
        if(!isCookieMode() && userStore.token && isAuthRequired(config.url)){
            config.headers.authorization = userStore.token
        }

        return config
    },

    err => Premise.reject(err)
)


// 认证失效统一清理：清用户状态 + 断开 WS + 提示 + 跳首页（业务码 401 与 HTTP 401 共用）
// config._quiet 为 true 时（如 verifyLogin 后台校验）：只清状态，不弹窗不跳转（网友刷新页面不该被"登录已过期"打扰）
const handleAuthExpired = (message, config) => {
    const userStore = useUserStore()
    // 清除 websocket 连接状态
    closeWebSocket()
    // 清空用户所有数据
    userStore.clearUserStore()
    // 后台静默校验触发的失效：清状态即可，不打扰用户
    if (config && config._quiet) {
        return
    }
    // 提示用户重新登录
    // emitter.emit('loginDialogVisible',true)
    // 提示信息
    window.$snackbar?.error(message || '登录已过期，请重新登录')
    router.replace('/')
}

//添加响应拦截器
instance.interceptors.response.use(
    res=>{
        if(res.data.code === 0 || res.data.code === 200){
            return res.data
        }

        //匹配状态码为40开头的正则，以及认证失效码 215（token过期）/ 216（账号已退出）
       let regex = /^40[0-9]$/

              if(regex.test(res.data.code) || res.data.code === 215 || res.data.code === 216) {

            if(res.data.code === 401 || res.data.code === 215 || res.data.code === 216){
                console.log('==================== 响应拦截器执行 ====================')
                // 处理token过期或者篡改
                handleAuthExpired(res.data?.message, res.config)

            }else window.$snackbar?.error(res.data.message)

            // 返回 reject 让调用方的 catch/finally 正常执行，loading 状态能正确复位
            return Promise.reject(res.data.message)
       }

        window.$snackbar?.error(res.data?.message || '服务异常')
        return Promise.reject(res.data.message)
    },
    err=>{
        // HTTP 401（cookie 模式未登录/过期的主路径）：与业务码 401 走同一清理逻辑
        if(err.response && err.response.status === 401){
            handleAuthExpired(undefined, err.config)
            return Promise.reject(err)
        }
        let message
        if (err.code === 'ECONNABORTED') {
            message = '请求超时，请检查网络连接'
        } else if (['ERR_NETWORK', 'ERR_CONNECTION_REFUSED'].includes(err.code)
                || err.message === 'Network Error') {
            message = '网络连接失败，请检查网络'
        } else {
            message = '服务异常，请稍后重试'
        }
        window.$snackbar?.error(message)
        return Promise.reject(err)
    }
)

export default instance;