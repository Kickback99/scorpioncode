// 双模式认证适配器：jwt（token 前端存储）/ cookie（HttpOnly Cookie 由浏览器管理，JS 不可见）
// 模式由构建时的 VITE_AUTH_MODE 环境变量决定（.env.development / .env.test / .env.production）
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'jwt'

/**
 * 是否 cookie 认证模式
 */
export const isCookieMode = () => AUTH_MODE === 'cookie'
