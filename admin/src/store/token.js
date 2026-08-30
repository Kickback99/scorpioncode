import {defineStore} from 'pinia'
import { ref } from 'vue'
import CryptoJS from 'crypto-js'
import { useUserStore } from './user';
import { isCookieMode, clearAdminAuthFlag } from '@/utils/auth'

// 定义store
// defineStore('仓库的唯一标识',()=>{...})

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export const useTokenStore = defineStore('token',{
    state:()=>({
        token:'',

        // 记住密码凭证
        savedUsername:'',
        savedPassword:'',
        rememberMe:false
    }),
    actions:{
        setToken(newToken) {
            // cookie 模式：token 在 HttpOnly Cookie 中由浏览器管理，前端不存储（置空顺带覆盖历史残留）
            this.token = isCookieMode() ? '' : (newToken || '')
        },
        removeToken(){
            this.token = ''
            // cookie 模式：同步清除登录标记 cookie（手动登出/401 自愈/强退下线统一走这里兜底）
            if (isCookieMode()) clearAdminAuthFlag()
        },
        // 保存用户凭证
        saveCredentials(username, password) {
            this.savedUsername = username
            this.savedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
            this.rememberMe = true
        },
        // 获取解密后的密码
        getDecryptedPassword() {
            if (!this.savedPassword) return ''
            try {
                const bytes = CryptoJS.AES.decrypt(this.savedPassword, ENCRYPTION_KEY)
                const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8)
                
                // 如果解密失败或结果为空，清除无效的凭证
                if (!decryptedPassword) {
                    this.clearCredentials()
                    return ''
                }
                
                return decryptedPassword
            } catch (error) {
                console.error('密码解密失败:', error)
                this.clearCredentials()
                return ''
            }
        },
        // 清除用户凭证
        clearCredentials() {
            this.savedUsername = ''
            this.savedPassword = ''
            this.rememberMe = false
        },
        // 检查是否有保存的凭证
        hasSavedCredentials() {
            return this.rememberMe && this.savedUsername && this.savedPassword
        }
        
    },
    persist:true
})