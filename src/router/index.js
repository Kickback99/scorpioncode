import {createRouter, createWebHistory} from 'vue-router'
import { nextTick } from 'vue'
import Layout from '@/views/Layout.vue'
import {useUserStore} from '@/store/user'
import {useTokenStore} from '@/store/token'
// 引入进度条
import nprogress from 'nprogress'
// 引入进度条样式
import "nprogress/nprogress.css"
import { useSettingStore } from '@/setting'
import { add403Routes } from '@/utils/403route'
import { add404Routes } from '@/utils/404route'
import { useConfigStore } from '@/store/config'
import { useUserConfigStore } from '@/store/userConfig'
import msg from '@/components/msg'
import { isCookieMode, hasAdminAuthFlag } from '@/utils/auth'



// 路由规则
export const routes = [
    {path:'/login',component:() => import('@/views/Login.vue')},
    { path:'/',redirect:'/index',name:'parentNode',
        meta:{
        hidden:true
        },
    component:Layout,
    children:[
        {path:'/index',component:() => import('@/views/home/index.vue'),
            meta:{
               title:'仪表盘',
               icon: 'ri:airplay-fill'
            }
        },
        {path:'/user/profile',component:() =>import('@/views/user/UserProfile.vue'),
            meta:{
                title:'基本资料',
                icon: 'ri:file-user-fill'
            }
        },
        {path:'/user/rePassword',component:() =>import('@/views/user/UserRePassword.vue'),
            meta:{
                title:'重置密码',
                icon: 'ri:phone-lock-line'
            }
        },
        {path:'/test',component:() => import('@/views/Test.vue'),
            meta: {
                title: '测试',
                icon: 'ri:bard-line'
            }            
        }
    ]}
]

const sysModules = import.meta.glob('../views/system/**/*.vue')
const conModules = import.meta.glob('../views/content/**/*.vue')
const msgModules = import.meta.glob('../views/msg/**/*.vue')
const monitorModules = import.meta.glob("../views/monitor/**/*.vue")
const resourceModules = import.meta.glob('../views/resource/**/*.vue')
const configModules = import.meta.glob('../views/config/*.vue')
const taskModules = import.meta.glob('../views/task/*.vue')
const writeModules = import.meta.glob('../views/write/*.vue')

// 处理前端需要的路由规则格式
function routesHandler(router,parentType=null){
    return router.map(route => {
        // 处理顶层路由：为顶层路由设置type属性
        if(route.component === 'Layout'){
              route.component = Layout
              const newStr =  route.path.substring(1)
              route.name = newStr
              route.type = newStr
            //   route.redirect = `${route.path}/${route.children[0].path}` //这样处理会报错
              if(route.children && route.children.length > 0){
                  route.redirect = `${route.path}/${route.children[0].path}`
              }
        }else if(route.component === 'list'){
            // 标记为需要添加到 parentNode 的配置管理路由
            route._addToParentNode = true
            const newStr =  route.path.substring(1)
            route.name = newStr
            route.type = newStr
            // 根据父路由的type来决定使用哪个模块导入
            let modules;
            switch(route.type){
                case 'config':
                    modules = configModules
                    break
                case 'task':
                    modules = taskModules
                    break
                case 'write':
                    modules = writeModules
                    break
                default:
                    modules = null
            }
            
            if(modules){
                const compName = route.component
                // 注意：这里 component 字段存储的是相对路径，如 'config/sysConfig/list'
                const path = `../views/${route.name}/${compName}.vue`
                // console.log('加载配置管理组件:', path)
                route.component = modules[path]
            }}else {
            // 如果是子路由，继承父路由的type属性
            route.type = parentType
            // 根据父路由的type来决定使用哪个模块导入
            // const modules = parentType === 'system'?sysModules:conModules;
            let modules;
            switch(parentType){
                case 'system':
                    modules = sysModules
                    break
                case 'content':
                    modules = conModules
                    break
                case 'msg':
                    modules = msgModules
                    break
                case 'monitor':
                    modules = monitorModules
                    break
                case 'resource':
                    modules = resourceModules
                    break
            }



            // 处理二级子菜单：为这些孩子构建新的属性(parentPath，level)便于menu来添加父级路径
            if(route.children != null && route.component == 'ParentView'){
                let parent = route.path
                route.redirect = route.children[0].path
                route.children.map(item => {
                    item.parentPath = parent
                    item.level = true
                })
            }
            // 子路由
            if(modules){
                route.name = route.path
                const compName = route.component
                const path = `../views/${compName}.vue`
                // console.log('到底加载的是哪个组件--------')
                // console.log(modules[path])
                route.component = modules[path]
            }
        }

        // 处理children
        if(route.children && route.children.length > 0){
            route.children = routesHandler(route.children,route.type)
        }
        return route
    })
}

export const loadMenu = async(loadUserInfo = true,to,from,next) => {
    const userStore = useUserStore()
    const configStore = useConfigStore()
    const userConfigStore = useUserConfigStore();
     console.log('==================== 请求菜单 ====================')
   
    try {
        // ================= 1. 数据获取阶段 =================
        let menuData
        if(loadUserInfo){
            // 场景1：完整获取用户信息+菜单
            const res = await userStore.getUserInfo();
            menuData = {
                    routers: res.data.routers,
                    permissions: res.data.permissions
            };
        } else {
            // 场景2：仅刷新菜单(修改菜单后调用)
            const res = await userStore.refreshMenuOnly();
            menuData = {
                routers: res.routers,
                permissions: res.permissions
            };
        }

    // ================= 1.5 加载系统配置 =================
    // 确保系统配置已加载（用于路由守卫中的菜单折叠等判断）

    // ================= 1.6 加载用户配置 =================
    await userConfigStore.fetchUserConfig();
    // applyTheme 由 App.vue watch(route) 在路由跳转后触发（避免登录页闪现用户主题）

    await configStore.loadConfig()

    // ================= 2. 权限校验阶段 =================

        // 无菜单权限拦截
        if (menuData.routers.length === 0 ) {
            console.log('情况2拦截')
        add403Routes(router); // 确保403路由存在
        return Promise.reject({ 
            noMenuPermission: true, 
            message: '该用户无菜单权限' 
        });
        }

    // ================= 3. 路由处理阶段 =================
    // 清除旧路由
    // 移除现有的404路由，确保动态路由优先匹配
    // remove404Routes()
        

    // 处理新路由
    const asyncRoutes = routesHandler(menuData.routers);
    // console.log('后端返回',menuData.routers)
    // console.log('路由数据',asyncRoutes)
    asyncRoutes.forEach(route => {
        if (route._addToParentNode) {
            // 配置管理类菜单添加到 parentNode 下
            router.addRoute('parentNode', route);
            // console.log(`添加配置管理路由到 parentNode: ${route.path}`);
        } else {
            // Layout 顶层路由正常添加
            router.addRoute(route);
            // console.log(`添加普通路由: ${route.path}`);
        }
    });

  

    // 更新Store中的菜单引用
    userStore.setUserMenu(menuData.routers);
    userStore.setUserPerm(menuData.permissions);

    // 记录旧菜单路由，供权限变更后区分 403 和 404
    const previousMenuRoutes = getPersistedMenuRoutes()

    // 将当前已注册路由持久化，供无 token 前置守卫识别菜单路径
    localStorage.setItem(MENU_ROUTES_STORAGE_KEY, JSON.stringify(router.getRoutes().map(route => route.path)))

    // 确保403路由存在
    add404Routes(router)
    add403Routes(router);

    /* console.log('动态路由更新完成', {
      routes: router.getRoutes(),
      permissions: menuData.permissions
    }); */
    
    
    // 仅刷新菜单的场景（loadMenu(false)）没有导航上下文，跳过守卫校验
    if (!to || typeof next !== 'function') {
        return true
    }

    // 用户菜单权限不足校验
    if(!hasRouteByPath(to.path)){
        const menuRoutes = previousMenuRoutes || getStoredMenuRoutes()
        if (menuRoutes.has(to.path)) {
            // console.log('router.getRoutes()',router.getRoutes())
            // console.log('用户菜单权限不足')
            return Promise.reject({
                noMenuAccess: true,
                message: '该用户无菜单权限'
            });
        }
        return next('/404')
    }
//    console.log('router.getRoutes()',router.getRoutes())
//    console.log('用户菜单权限充足')
    return true;
    } catch (error) {
        console.log('error,',error)
    // 请求失败（如网络错误或API错误）
    return Promise.reject(error);
    }

}

const hasRouteByPath = (path) => {
    return router.getRoutes().some(route => route.path === path)
}

// 创建路由对象

const router = createRouter({
    //t_env：router
    history:createWebHistory(import.meta.env.VITE_ROUTER_URL), //采用 html5 路由模式
    routes
})

let count = 1;

function addDynamicRoutes(routerData){
    routerData.forEach(r => {
        //router.addRoute('/',r) //错误写法
        router.addRoute('parentNode',r) //此处必须填写的父路由名字(name)
    })
}

const modules = import.meta.glob('../views/temp/*.vue')

const routerData = Object.entries(modules).map(([filePath, component]) => {
    // 提取文件名（不含扩展名）
    const fileName = filePath.split('/').pop().replace('.vue', '')
    
    return {
        path: `/${fileName.toLowerCase()}`, // 路径，如：/temp1
        name: fileName, // 路由名称，如：temp1
        component: component, // 组件
        meta: { title: `${fileName}页面`,icon: 'ri:zzz-fill' } // 可选的元信息
    }
})

addDynamicRoutes(routerData)

const MENU_ROUTES_STORAGE_KEY = 'menuRoutes'

const getPersistedMenuRoutes = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(MENU_ROUTES_STORAGE_KEY) || 'null')
    return Array.isArray(stored) ? new Set(stored) : null
  } catch (error) {
    return null
  }
}

const getStoredMenuRoutes = () => {
  const persistedMenuRoutes = getPersistedMenuRoutes()
  if (persistedMenuRoutes) return persistedMenuRoutes
  return new Set(router.getRoutes().map(route => route.path))
}

const cleanupTabsByCurrentRoutes = () => {
  nextTick(() => {
    const allPaths = new Set(router.getRoutes().map(route => route.path))
    useSettingStore().cleanupTabsByMenu(allPaths)
  })
}

const whiteList = ['/login','/register','/401']

router.beforeEach((to, from, next) => {
    nprogress.start()
    const settings =  useSettingStore()
    ++count;
    console.log('==================== 路由前置守卫执行 ====================')
    // console.log(from)
    // console.log(to.path)
    // console.log(to.fullPath)
    const userStore = useUserStore()
    const tokenStore = useTokenStore()
    // console.log('userStore.userMenu.length',userStore.userMenu.length )

    if(to.path === '/403' && settings.isManualTo403){
        settings.isManualTo403 = false
        return next()
    }


    // 已登录不能输入登录地址回到登录页
    // cookie 模式无同步 token，用后端下发的登录标记 cookie 判断（刷新后依然稳定，认证真值以服务端为准）
    const isLogin = isCookieMode() ? hasAdminAuthFlag() : !!tokenStore.token
    if(to.path === '/login' && isLogin) {
        console.log('==================== 已登录不能输入登录地址回到登录页 ====================')
        msg.warning('请先退出登录')
        return next(from.fullPath);
    }

    // 白名单放行
    if(whiteList.includes(to.path)){
        console.log('==================== 白名单放行 ====================')
      return next();
    }

    // 如果没有token跳转到登录页
    // cookie 模式无法同步判断登录态：跳过此检查，交给下方 loadMenu → userDetailInfo
    // 200=已登录（填菜单放行）；401=未登录（request.js 拦截器兜底跳 /login）
    if(!isCookieMode() && !tokenStore.token && to.path != '/login') {
        // msg.error('如果没有token跳转到登录页')
        // 清除主动退出标记，让 redirect 正常生效
        const settings = useSettingStore()
        settings.setLogoutIntent(false)
    // /404 自身直接放行，避免循环重定向
    if (to.path === '/404') {
        if (!router.hasRoute('404')) {
            add404Routes(router)
            return next({ ...to, replace: true })
        }
        return next()
    }
    // JWT 模式：目标不是已注册菜单路由时进入 404
    const menuRoutes = getStoredMenuRoutes()
    if (!menuRoutes.has(to.path)) {
        console.log('==================== jwt not redirect ====================')
        add404Routes(router)
        return next('/404')
    }
    // 重定向到登录页面，使用原始路径避免重复编码
    return next({
        path: '/login',
        query: {
            redirect: to.path + (to.query && Object.keys(to.query).length ? `?${new URLSearchParams(to.query).toString()}` : '')
        }
    });
    }

    // 已登录，有菜单
    if(userStore.userMenu && userStore.userMenu.length > 0){
        //放行
        console.log('==================== 已登录，有菜单 ====================')
        return next()
    }

    // /404 已注册时直接放行，避免 token 仍存在时再次进入 loadMenu 或循环重定向
    if (to.path === '/404') {
        if (!router.hasRoute('404')) {
            add404Routes(router)
            return next({ ...to, replace: true })
        }
        return next()
    }

    // cookie 模式，或 JWT 模式已有 token 但菜单尚未加载时，优先用本地缓存识别不存在的路径
    const persistedMenuRoutes = getPersistedMenuRoutes()
    const menuRoutes = persistedMenuRoutes || getStoredMenuRoutes()
    if (!isLogin && menuRoutes && to.path !== '/404' && !menuRoutes.has(to.path)) {
        console.log('==================== cookie not redirect ====================')
        add404Routes(router)
        return next('/404')
    }

    // 已登录，无菜单 => 按需加载菜单
    loadMenu(true,to,from,next).then(
        ()=>{
            next({...to,replace:true})
            // 路由注册后，清理不在路由表中的标签页
            cleanupTabsByCurrentRoutes()
    }).catch((error) =>
        {
            // 无菜单权限的后台用户 -> 跳转403
            if (error.noMenuPermission) {
                if(hasRouteByPath(to.path)){
                    next()
                }else {
                    // console.log('拦截2')
                settings.isManualTo403 = true;
                next('/403');
                }
            }else if(error.noMenuAccess){
                // console.log('拦截1')
                settings.isManualTo403 = true;
                next('/403');
                // 权限收回后清理不在当前路由表中的标签页
                cleanupTabsByCurrentRoutes()
            }else {
                msg.error(error|| '加载菜单失败');
                next(false); // 阻止导航
            }
                 
        }
    )
});

router.afterEach((to, from) => {
    nprogress.done()
})

// 将路由对象暴露出去
export default router
