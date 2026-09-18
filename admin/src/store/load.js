// stores/load.js

import { defineStore } from "pinia"
export const useLoadStore = defineStore({
  id: 'load',
  state: () => ({
    loadedComponents: {}, // 改为动态键值对
    // t_setting：在icons组件加载之前排除以下动态名字路由的预加载
    excludeDynamicComponents:['icon','sysMenu'],
     // t_setting：在icons组件加载之前排除以下本地名字路由的预加载
    excludeLocalComponents:['404'],
    plainComponent:[]
  }),
  actions: {
    setComponentLoaded(name) {
      this.loadedComponents[name] = true
    },
    isComponentLoaded(name) {
      return this.loadedComponents[name]
    }
  }
})