// stores/articleDraft.js — 文章编辑草稿持久化
// sessionStorage 持久化，关闭浏览器自动清理；跨路由导航保持编辑状态

import { defineStore } from 'pinia'

export const useArticleDraftStore = defineStore({
  id: 'articleDraft',
  state: () => ({
    blogData: null,                // { title, content }
    formModel: null,               // 弹窗表单数据（分类、标签、封面等）
    carouselData: null,            // { isCarousel, sort, carouselId, articleId }
    selectedCoverArticle: null,    // 引用封面 — SmartAutoComplete 选中的文章标题数组
    coverFileBase64: null,         // 文件上传封面 — base64 data URL（File 无法直接序列化）
    coverFileMeta: null,           // 文件上传封面 — { name, size, type, lastModified }
    imageRefSelectedArticle: null, // ImageReference 选中的文章标题数组
    imageRefSelectedArticleId: null, // ImageReference 选中的文章 ID（用于 loadByArticleId 恢复）
    updatedAt: null,               // 最后更新时间戳
  }),
  getters: {
    /**
     * 是否有有效草稿 — blogData 存在且有标题或内容
     */
    hasDraft: (state) => {
      if (!state.blogData) return false
      return !!(state.blogData.title || state.blogData.content)
    },
  },
  actions: {
    /**
     * 保存草稿 — 深拷贝避免引用污染
     * @param {{ blogData: object, formModel: object, carouselData: object }} data
     */
    saveDraft(data) {
      this.blogData = JSON.parse(JSON.stringify(data.blogData))
      this.formModel = JSON.parse(JSON.stringify(data.formModel))
      this.carouselData = JSON.parse(JSON.stringify(data.carouselData))
      this.selectedCoverArticle = JSON.parse(JSON.stringify(data.selectedCoverArticle || []))
      this.coverFileBase64 = data.coverFileBase64 || null
      this.coverFileMeta = data.coverFileMeta ? JSON.parse(JSON.stringify(data.coverFileMeta)) : null
      this.imageRefSelectedArticle = JSON.parse(JSON.stringify(data.imageRefSelectedArticle || []))
      this.imageRefSelectedArticleId = data.imageRefSelectedArticleId || null
      this.updatedAt = Date.now()
    },

    /**
     * 恢复草稿 — 深拷贝返回，不影响 store 内部状态
     * @returns {{ blogData, formModel, carouselData } | null}
     */
    restoreDraft() {
      if (!this.hasDraft) return null
      return {
        blogData: JSON.parse(JSON.stringify(this.blogData)),
        formModel: JSON.parse(JSON.stringify(this.formModel)),
        carouselData: JSON.parse(JSON.stringify(this.carouselData)),
        selectedCoverArticle: JSON.parse(JSON.stringify(this.selectedCoverArticle || [])),
        coverFileBase64: this.coverFileBase64 || null,
        coverFileMeta: this.coverFileMeta ? JSON.parse(JSON.stringify(this.coverFileMeta)) : null,
        imageRefSelectedArticle: JSON.parse(JSON.stringify(this.imageRefSelectedArticle || [])),
        imageRefSelectedArticleId: this.imageRefSelectedArticleId || null,
      }
    },

    /** 清除草稿 */
    clearDraft() {
      this.blogData = null
      this.formModel = null
      this.carouselData = null
      this.selectedCoverArticle = null
      this.coverFileBase64 = null
      this.coverFileMeta = null
      this.imageRefSelectedArticle = null
      this.imageRefSelectedArticleId = null
      this.updatedAt = null
    },
  },
  persist: {
    storage: sessionStorage,
  },
})
