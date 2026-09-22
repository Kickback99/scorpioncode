import { defineStore } from "pinia";
import {userInfoApi} from '@/api/admin'

export const useUserStore = defineStore({
    id:'user',
    state:()=>({
        userMenu:[],
        userPerm:[],
        userInfo:{},
        roleNames:[],
        menuData:{
            routers:[],
            permissions:[]
        },
        hasUserInfo: false
    }),
    getters:{
        isAdmin: (state) => state.userInfo?.isAdmin || false,
    },
    actions:{
        async getUserInfo(forceRefreshMenu = false){

            // 已有基础信息且不强制刷新 → 仅返回菜单数据
            if (this.hasUserInfo && !forceRefreshMenu) {
                console.log('==================== 请求菜单，懒加载用户信息 ====================')
                return {data: this.menuData}
            }
            
            if(forceRefreshMenu == false){
                console.log('==================== 用户信息全量请求 ====================')
                    // t_user_request：获取用户权限请求
                try{
                const res = await userInfoApi()
                this.userInfo = res.data.userInfo
                this.roleNames = res.data.roleNames
                this.userId = res.data.userInfo.id
                this.menuData = {
                    routers:res.data.routers,
                    permissions:res.data.permissions
                }
                    this.hasUserInfo = true // 设置标志位
                    return res
                }catch(error){
                    return Promise.reject(error)
                }
            }else {
                // 仅获取用户信息
                console.log('仅获取用户信息')
                const res = await userInfoApi()
                this.userInfo = res.data.userInfo
                this.roleNames = res.data.roleNames
                return res.data.userInfo
            }
      
        },
        // 仅刷新菜单数据
        async refreshMenuOnly() {
            const res = await userInfoApi();
            return res.data;
        },
        setUserMenu(menuData){
            this.userMenu = menuData
        },
        // WebSocket 权限推送预留写入入口（permission_changed → setUserPerm）
        setUserPerm(menuData){
            this.userPerm = menuData
        },
        setUserInfo(userInfo){
            this.userInfo = userInfo
        },
        setRoleNames(roleNames){
            this.roleNames = roleNames
        },
        removeUserAuth(){
            this.userMenu = []
            this.userPerm = []
        },
        setRemoveUserInfo(){
            this.userInfo = {},
            this.roleNames = []
            this.hasUserInfo = false
        },
        // 清除当前用户所有数据
        clearUserStore(){
            this.$reset()
        }
    }
})