// 工具函数：添加403路由
export const add403Routes = (router) => {
  /* if (!router.hasRoute('NotFound')) {
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/404'
    });
    router.addRoute({
      path: '/404',
      name: '404',
      component: () => import('@/views/error/404.vue')
    });
  } */
  if(!router.hasRoute('403')){
      router.addRoute({
        path: '/403',
        name: '403',
        component: () => import('@/views/error/403.vue')
      });
  }
};