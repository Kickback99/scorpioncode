import { userInfoApi } from '@/api/user'
import {defineStore} from 'pinia'
import { isCookieMode } from '@/utils/auth'

// 定义store
// defineStore('仓库的唯一标识',()=>{...})

// 仅持久化展示所需字段（email/phone 等 PII 不落 localStorage；内存中的 user 仍是完整 VO）
// 注意：undefined 键虽然会被 JSON.stringify 丢弃（落盘为空对象），但 hydrate 时会重新生成
// 导致 Object.keys(user).length > 0 误判"有缓存"，进而每次刷新都发校验请求，必须过滤掉
const pickUserFields = (user) => {
  if (!user || typeof user !== 'object') return {}
  const result = {}
  if (user.id != null) result.id = user.id
  if (user.username != null) result.username = user.username
  if (user.nickname != null) result.nickname = user.nickname
  if (user.avatar != null) result.avatar = user.avatar
  return result
}

export const useUserStore = defineStore('user',{
    state:()=>({
        token:'',
        user:{},
        // 本次会话是否已校验过登录态（内存标志，不持久化，等价管理端 hasUserInfo 懒加载）
        loginVerified:false
    }),
    getters:{
        // 登录态判定：cookie 模式看 user 展示缓存（服务端校验失败后会被清空），jwt 模式看 token+user
        isLoggedIn:(state) => isCookieMode()
            ? Object.keys(state.user).length > 0
            : !!state.token && Object.keys(state.user).length > 0
    },
    actions:{
        setToken(newToken) {
            // cookie 模式：token 在 HttpOnly Cookie 中由浏览器管理，前端不存储（置空顺带覆盖历史残留）
            this.token = isCookieMode() ? '' : (newToken || '')
        },
        removeToken(){
            this.token = ''
        },
        async getUser(){
            try {
                const res = await userInfoApi()
                this.user = res.data
            } catch (error) {
                return Promise.reject(error)
            }
        },
        // 会话内校验登录态：本地有登录态证据时才请求一次服务端校验（未登录网友零请求）
        async verifyLogin(){
            if (this.loginVerified) return
            this.loginVerified = true
            // 本地登录态证据：cookie 模式看 user 展示缓存，jwt 模式看 token
            const hasLocalAuth = isCookieMode() ? Object.keys(this.user).length > 0 : !!this.token
            if (!hasLocalAuth) return
            try {
                // _quiet：后台静默校验，401 时拦截器只清状态、不弹窗不跳转（网友刷新页面不该被"登录已过期"打扰）
                const res = await userInfoApi({ _quiet: true })
                this.user = res.data   // 200：刷新展示缓存
            } catch (error) {
                // 401 时 http.js 拦截器已静默清空缓存，这里不再处理
            }
        },
        setUser(user) {
            this.user = user
        },
        removeUser(){
            this.user = {}
        },
        // 清除当前用户所有数据
        clearUserStore(){
            this.$reset()
        }
    },
    persist:{
        paths:['token','user'],
        // 自定义序列化：仅持久化展示所需字段（email/phone 等 PII 不落 localStorage）；旧版本数据自动迁移裁剪
        serializer:{
            serialize(state){
                const { token, user } = state
                return JSON.stringify({ token, user: pickUserFields(user) })
            },
            deserialize(value){
                try {
                    const data = JSON.parse(value || '{}')
                    return { token: data.token || '', user: pickUserFields(data.user), loginVerified: false }
                } catch (error) {
                    return { token: '', user: {}, loginVerified: false }
                }
            }
        }
    }
})
