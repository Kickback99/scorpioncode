// 添加404路由的函数
export const add404Routes = (router) => {

    if (!router.hasRoute('NotFound')) {
        router.addRoute({
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            redirect: '/404'
        })
    }

    // 确保不会重复添加
    if (!router.hasRoute('404')) {
        router.addRoute({
            path: '/404',
            name: '404',
            component: () => import('@/views/error/404.vue')
        })
    }
}