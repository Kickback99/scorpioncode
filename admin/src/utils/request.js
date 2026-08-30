import axios from 'axios';
//定义一个变量,记录公共的前缀  ,  baseURL
//t_env：axios_baseURL
const baseURL = import.meta.env.VITE_API;
// withCredentials：cookie 模式下跨域请求携带 HttpOnly Cookie（同源请求无影响）
const instance = axios.create({baseURL,timeout:15000,withCredentials:true})
import {useTokenStore} from '@/store/token'
import { isCookieMode } from '@/utils/auth'
import { useUserStore } from '@/store/user';
import router from '@/router';
import { clearRoute } from './remove';
import { useTabStore } from '@/store/tabs';
import { useUserConfigStore } from '@/store/userConfig'
import { useUiStore } from '@/store/ui'
import { useSettingStore } from '@/setting'
import { applyTheme } from '@/assets/common/theme'
import msg from '@/components/msg'



// 认证失效统一清理：清 token/动态路由/用户信息，并跳转登录页
// （业务码 401/215/216 与 HTTP 401 共用，cookie 模式与 jwt 模式共用）
const handleAuthExpired = (config, message) => {
    // 请求时已保存的路径（避免 401 到达前路由已被篡改）
    const currentPath = config._currentPath || router.currentRoute.value.fullPath
    // 处理token过期或者篡改
    const tokenStore = useTokenStore()
    const userStore = useUserStore()
    const tabStore = useTabStore()
    // 清空token（cookie 模式会自动同步清除登录标记 cookie）
    tokenStore.removeToken()
    // 清空动态路由数据
    clearRoute(userStore.userMenu)
    // 清空用户信息和菜单
    userStore.clearUserStore()
    // 未开启保留标签时清空
    const settingStore = useSettingStore()
    if (!settingStore.keepTabs) {
      tabStore.clearTabs()
    }
    // 暂存主题到 uiStore（登录页读取用），再清除用户配置
    const userConfigStore = useUserConfigStore()
    const uiStore = useUiStore()
    uiStore.setLastTheme(userConfigStore.theme)
    userConfigStore.clearUserConfig()
    document.documentElement.classList.remove('dark')
    applyTheme('default', false)
    msg.error(message)
    // 404 页返回仪表盘时忽略 redirect，避免重登后回到 404
    const shouldIgnoreRedirect = currentPath.split('?')[0] === '/404'
    settingStore.setLogoutIntent(shouldIgnoreRedirect)
    router.replace({
        path: '/login',
        query: shouldIgnoreRedirect ? {} : { redirect: currentPath }
    })
}

// 添加请求拦截器
instance.interceptors.request.use(
    config => {
        const tokenStore =  useTokenStore()
        // 请求发出时保存浏览器地址栏路径，401 响应中用于 redirect
        // 生产环境路由带 base 前缀(/admin/)，剥离为内部路径，否则登录后重定向 404
        const currentPath = window.location.href.replace(window.location.origin, '')
        const routerBase = import.meta.env.VITE_ROUTER_URL
        config._currentPath = routerBase && currentPath.startsWith(routerBase)
            ? currentPath.slice(routerBase.length - 1) || '/'
            : currentPath
        // jwt 模式手动带 authorization 头；cookie 模式由浏览器自动携带 HttpOnly Cookie
        if(!isCookieMode() && tokenStore.token){
            config.headers.authorization = tokenStore.token
        }

        return config
    },

    err => Premise.reject(err)
)

// 添加响应拦截器
instance.interceptors.response.use(
    res=>{
        if(res.data.code === 0 || res.data.code === 200){
            return res.data
        }
        

       // 匹配状态码为40开头的正则，以及认证失效码 215（token过期）/ 216（账号已退出）
       let regex = /^40[0-9]$/

       if(regex.test(res.data.code) || res.data.code === 215 || res.data.code === 216) {

            if(res.data.code === 401 || res.data.code === 215 || res.data.code === 216){
                console.log('==================== 响应拦截器执行 ====================')
                handleAuthExpired(res.config, res.data.message)

            }else msg.error(res.data.message)

            // return Promise.reject(res.data.message)
            // 关键：返回pending的Promise，阻止错误开始向上传递的后续执行
             return new Promise(() => {})
       }

        msg.error(res.data.message || '业务失败')
        return Promise.reject(res.data.message)
    },
    err=>{
        // HTTP 401（cookie 模式下未登录/过期的主路径）：走与业务码一致的清理跳转，否则用户会困死在页面
        if(err.response && err.response.status === 401){
            handleAuthExpired(err.config, (err.response.data && err.response.data.message) || '请重新登录')
            // 返回pending的Promise，阻止错误开始向上传递的后续执行
            return new Promise(() => {})
        }
        alert('服务异常');
        return Promise.reject(err); // 异步的状态转化成失败的状态
    }
)

export default instance;