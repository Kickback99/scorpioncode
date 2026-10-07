// 双模式认证适配器：jwt（token 前端存储）/ cookie（HttpOnly Cookie 由浏览器管理，JS 不可见）
// 模式由构建时的 VITE_AUTH_MODE 环境变量决定（.env.development / .env.test / .env.production）
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'jwt'

// 后端 cookie 模式下同步下发的登录标记 cookie（非 HttpOnly、值 "1"、不含秘密）
const ADMIN_FLAG_COOKIE = 'sc_auth_admin_flag'

/**
 * 是否 cookie 认证模式
 */
export const isCookieMode = () => AUTH_MODE === 'cookie'

/**
 * 读取指定名称的 cookie 值
 */
export function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

/**
 * cookie 模式同步登录态信号：刷新后 JS 读不到 HttpOnly 主 cookie，靠标记 cookie 判断
 */
export const hasAdminAuthFlag = () => getCookie(ADMIN_FLAG_COOKIE) === '1'

/**
 * 清除登录标记 cookie（401 自愈时兜底，非 HttpOnly 可从 JS 删除）
 */
export function clearAdminAuthFlag() {
  document.cookie = ADMIN_FLAG_COOKIE + '=; Max-Age=0; path=/'
}
