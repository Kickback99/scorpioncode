import AppIndex from '@/views/AppIndex.vue'
import AppLayout from '@/views/AppLayout.vue'
import {createRouter, createWebHistory} from 'vue-router'
import { useUserStore } from '@/store/user'
import { useConfigStore } from '@/store/config'

// 非首屏路由懒加载：详情页引用的 Markdown 编辑器（v-md-editor + highlight.js + prismjs 等重型依赖）
// 只有访问到对应页面时才下载对应 chunk，避免拖慢首页首屏
const AppDetail = () => import('@/views/AppDetail.vue')
const AppAbout = () => import('@/views/AppAbout.vue')
const AppFriendLink = () => import('@/views/AppFriendLink.vue')
const AppProfileCenter = () => import('@/components/AppProfileCenter.vue')
const AppNotFound = () => import('@/views/AppNotFound.vue')


// 路由规则
const routes = [
    {path:"/",component :AppLayout,children:[
        {path:"",component:AppIndex},
        {path:"/friendLink",component:AppFriendLink},
        {path:"/about",component:AppAbout},
        {path:"/404",name:'NotFound',component:AppNotFound},
        {
            path: '/profile',
            name: 'Profile',
            component: AppProfileCenter,
            // 需登录访问：守卫按 meta 判定，不再比较 path 字面量
            meta: { requiresAuth: true }
        },
        {path:"/detail/:id",name:'detail',component:AppDetail,props:true},
        {path:'/:pathMatch(.*)*',redirect:'/404'},
    ]}
]

// 创建路由对象

const router = createRouter({
    history:createWebHistory(import.meta.env.VITE_ROUTER_URL), //采用 html5 路由模式
    routes
})

// 配置管理
let configLoaded = false
let loadingPromise = null
let lastLoadTime = 0
const CONFIG_CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存，可根据需要调整

/**
 * 加载客户端配置（支持缓存过期）
 * @param {boolean} forceRefresh - 是否强制刷新配置
 */
const loadClientConfig = async (forceRefresh = false) => {
  const now = Date.now()
  
  // 检查缓存是否有效（非强制刷新 且 已加载 且 未过期）
  if (!forceRefresh && configLoaded && (now - lastLoadTime) < CONFIG_CACHE_DURATION) {
    return Promise.resolve()
  }
  
  // 如果正在加载中，返回同一个 Promise
  if (loadingPromise) {
    return loadingPromise
  }
  
  // 开始加载配置
  loadingPromise = (async () => {
    try {
      const configStore = useConfigStore()
      await configStore.loadConfig()
      configLoaded = true
      lastLoadTime = now
    } catch (error) {
      // 配置加载失败时，使用默认配置
      // configStore 中已经设置了默认值，所以不影响页面访问
    } finally {
      loadingPromise = null
    }
  })()
  
  return loadingPromise
}

/**
 * 判断路由是否需要登录（按路由 meta 声明，而非比较 path 字面量）
 * Vue Router 匹配默认关闭敏感度（strict/sensitive 均为 false），/profile/、/PROFILE、/Profile
 * 都能命中该路由记录，但 route.path 保留 URL 原样，用字面量比较会漏判
 * @param {import('vue-router').RouteLocationNormalized} route
 */
export const requiresLogin = (route) => route.matched.some(record => record.meta.requiresAuth)

// 添加路由守卫
router.beforeEach(async(to, from, next) => {

  console.log('==================== 路由前置守卫执行 ====================')

  // 加载配置（非强制刷新）
  await loadClientConfig()

  const userStore = useUserStore()
  const configStore = useConfigStore()

  // 友链、关于页面配置关闭时，统一拦截跳转 404
  if (
    (to.path === '/friendLink' && !configStore.getFriendLinkEnabled()) ||
    (to.path === '/about' && !configStore.getAboutEnabled())
  ) {
    next('/404')
    return
  }

  // 需要登录才能访问的页面：按路由 meta 判定
  const requiresAuth = requiresLogin(to)

  if (requiresAuth) {
    // 先等服务端校验落地再判定：本地 user 缓存只是展示缓存（乐观渲染），不能作为放行依据，
    // 否则会话已失效时仍会渲染出受保护页面（校验结果回来后拦截器只静默清状态，不会退出该页）
    await userStore.verifyLogin()

    // 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
    if (!userStore.isLoggedIn) {
      if (configStore.getUserLoginEnabled()) {
        // 带上原目标：AppLogin 检测到 redirect 会自动弹出登录框，登录成功后回跳该路径
        next({ path: '/', query: { redirect: to.fullPath } })
      } else {
        // 登录功能已关闭：没有登录入口可引导，受保护页面当不存在处理（与友链/关于页关闭时一致）
        next('/404')
      }
      return
    }
  }

  next()
})

// 路由守卫完成后的回调 - 可以在页面加载后执行一些操作
router.afterEach(() => {
  // 滚动到顶部
  window.scrollTo(0, 0)
})

// 暴露 loadClientConfig 供根组件等待配置就绪
export { loadClientConfig }

// 提供一个方法，用于在配置更新后重新加载（可选，供其他组件调用）
export const refreshClientConfig = () => {
  configLoaded = false
  lastLoadTime = 0
  return loadClientConfig(true)
}

// 将路由对象暴露出去
export default router
