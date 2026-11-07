import { defineStore } from 'pinia'

// 标签单一数据源：AppSidebar 负责填充，AppBreadcrumb 消费，避免重复请求 /user/blog/tag
export const useTagStore = defineStore('tag', {

  // ============================================================
  // 数据
  // ============================================================
  state: () => ({
    list: []
  })
})
