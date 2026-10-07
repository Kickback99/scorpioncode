import router from "@/router"
import {useUserStore} from '@/store/user'

export const clearRoute = (res) => {
    res.forEach(item => {
        router.removeRoute(item.name)
        if(item.children && item.children.length > 0) {
            clearRoute(item.children)
        }
    })
    // 删除404路由
    router.removeRoute('NotFound')
    router.removeRoute('404')
}

export const clearUserInfo = () => {
    const userStore = useUserStore()
    // 删除用户信息
    userStore.setRemoveUserInfo()
}