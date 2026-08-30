import AppAbout from '@/views/AppAbout.vue'
import AppBlog from '@/views/AppBlog.vue'
import AppDetail from '@/views/AppDetail.vue'
import AppIndex from '@/views/AppIndex.vue'
import AppLayout from '@/views/AppLayout.vue'
import AppNotFound from '@/views/AppNotFound.vue'
import {createRouter, createWebHistory} from 'vue-router'
import { useUserStore } from '@/store/user'
import AppProfileCenter from '@/components/AppProfileCenter.vue'
import Test from '@/views/Test.vue'
import { useConfigStore } from '@/store/config'
import AppFriendLink from '@/views/AppFriendLink.vue'


// 路由规则
const routes = [
    {path:"/",component :AppLayout,children:[
        {path:"",component:AppIndex},
        {path:"/blog",component:AppBlog},
        {path:"/friendLink",component:AppFriendLink},
        {path:"/about",component:AppAbout},
        {path:"/404",name:'NotFound',component:AppNotFound},
        {
            path: '/profile',
            name: 'Profile',
            component: AppProfileCenter
        },
        {path:'/test',component:Test},
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

  // 登录态判定统一走 store getter（cookie 模式看 user 展示缓存，jwt 模式看 token+user）
  const isLoggedIn = userStore.isLoggedIn
  
  // 如果需要登录才能访问的页面
  if (to.path === '/profile' && !isLoggedIn) {
    next('/')
  } else {
    next()
  }
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
