import { defineStore } from "pinia"
export const useTabStore = defineStore({
  id: 'tabs',

  // ============================================================
  // 数据
  // ============================================================
  state: () => ({
    tabList:[],
    collapseStates:{}  // 搜索面板折叠偏好 { '/system/sysUser': ['search'], ... }
  }),

  // ============================================================
  // 计算属性
  // ============================================================
  getters:{
    getTabs:(state) => state.tabList
  },

  // ============================================================
  // 方法
  // ============================================================
  actions: {
    addTabs(tab){
        const existing = this.tabList.find(item => item.path === tab.path)
        if (existing) {
          // 同一路径但 query 参数可能不同，更新 fullPath
          existing.fullPath = tab.fullPath
          return
        }
        this.tabList.push(tab)
    },
    removeTab(path) {
      const idx = this.tabList.findIndex(t => t.path === path)
      if (idx !== -1) this.tabList.splice(idx, 1)
      this.removeCollapseState(path)
    },
    /** 整体替换标签页列表（关闭单个/右侧/其他/全部），并清理已关闭标签页的折叠偏好 */
    setTabList(tabs) {
      this.tabList = tabs
      const alive = new Set(tabs.map(t => t.path))
      Object.keys(this.collapseStates).forEach(path => {
        if (!alive.has(path)) this.removeCollapseState(path)
      })
    },
    setCollapseState(path, value) {
      this.collapseStates[path] = value
    },
    removeCollapseState(path) {
      delete this.collapseStates[path]
    },
    /** 清空全部折叠偏好，让各标签页回落到总开关默认值 */
    clearCollapseStates() {
      this.collapseStates = {}
    },
    clearTabs(){
      this.$reset()
       localStorage.removeItem('tabs');
    }
  },

  // ============================================================
  // 持久化
  // ============================================================
    persist: true,  // 开启当前仓库的持久化
	/* persist: {
		key: 'wzCount', // 修改 localStorage 的 key，默认用仓库唯一标识做为 key
		paths:['count'] // 存储的是哪些数据，默认存储整个 state 数据
	} */
})
