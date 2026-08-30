/**
 * 用户端 ConfigStore — 动态分组映射
 *
 * 核心设计：
 * - _groupKeys 按 group 归类 key 列表，是唯一需要手动维护的地方
 * - 模块加载时自动构建 _keyToGroup 反向索引，getValue / setValue 通过它动态拼接 state 路径
 * - 将来某项从 client 移到 user：只需在 _groupKeys 中移动那个 key 字符串
 *
 * 示例：'comment.article_comment_enabled' 从 client 移到 user
 *   client: [                        client: [
 *     'comment.article_comment_enabled',  →  （删除这行）
 *   ]                                 ]
 *                                      user: [
 *                                        'comment.article_comment_enabled',  →  （加到这里）
 *                                      ]
 *   所有 getValue('comment.article_comment_enabled') 自动读 this.user.comment...
 */

import { defineStore } from "pinia"
import { getConfigApi } from "@/api/config"

// ============================================================
// key 按 group 归类（唯一需要手动维护的地方）
// 迁移时只需把 key 字符串从一个数组移到另一个数组
// ============================================================
const _groupKeys = {
  client: [
    'websocket.enabled',
    'websocket.backend_enabled',
    'comment.article_comment_enabled',
    'comment.friend_link_comment_enabled',
    'comment.child_comment_limit',
    'comment.child_page_size',
    'comment.parent_page_size',
    'nav.friend_link_enabled',
    'nav.about_enabled',
    'user.login_enabled',
    'user.other_login_enabled',
    'profile.my_feedback_enabled',
    'profile.my_publishes_enabled',
    'profile.my_comments_enabled',
    'profile.my_favorites_enabled',
    'article_detail.theme',
    'article_detail.anchor_enabled',
    'article_detail.favorite_count_enabled',
    'article_list.view_enabled',
    'article_list.favorite_enabled',
    'article_list.comment_enabled',
    'article_list.load_mode',
    'article_list.scroll_page_size',
    'article_list.pagination_page_size',
    'notice.enabled',
    'notice.sse_enabled',
    'notice.dismissed_level'
  ],

  admin: [
    'article.carousel_limit',
  ],
}

// ============================================================
// 自动构建反向索引 key → group（模块加载时执行一次）
// ============================================================
const _keyToGroup = {}
for (const [group, keys] of Object.entries(_groupKeys)) {
  for (const key of keys) {
    _keyToGroup[key] = group
  }
}

// ============================================================
// 工具函数
// ============================================================
function deepGet(obj, path) {
  let cur = obj
  for (const k of path) { if (cur == null) return undefined; cur = cur[k] }
  return cur
}

function deepSet(obj, path, value) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in cur) || typeof cur[path[i]] !== 'object' || cur[path[i]] === null) {
      cur[path[i]] = {}
    }
    cur = cur[path[i]]
  }
  cur[path[path.length - 1]] = value
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    // 加载状态
    loading: false,

    // ===== client 前台 =====
    client: {
      websocket: {
        enabled: true,
        backend_enabled: false,
      },

      // 评论相关
      comment: {
        // 文章评论显示（true开启，false禁用）
        article_comment_enabled: true,
        // 友链评论显示（true开启，false禁用）
        friend_link_comment_enabled: false,
        // 子评论默认显示数量
        child_comment_limit: 3,
        // 子评论分页大小
        child_page_size: 7,
        // 父评论分页大小
        parent_page_size: 10
      },

      // 导航相关
      nav: {
        // 友链显示
        friend_link_enabled: false,
        // 关于页面显示
        about_enabled: false,
      },

      // 用户相关
      user: {
        // 前端登录（true开启，false禁用）
        login_enabled: true,
        // 前端其他登录（true开启，false禁用）
        other_login_enabled: false
      },

      // 个人中心相关
      profile: {
        my_feedback_enabled: false,
        my_publishes_enabled: false,
        my_comments_enabled: true,
        my_favorites_enabled: true
      },

      // 文章详情相关
      article_detail: {
        theme: 0, // 前端主题（0：github主题，1：vuepress主题）
        anchor_enabled: true, // 锚点显示（true开启，false禁用）
        favorite_count_enabled: true
      },

      // 文章列表相关
      article_list: {
        view_enabled: true,
        favorite_enabled: true,
        comment_enabled: true,
        load_mode: 'scroll',
        scroll_page_size: 10,
        pagination_page_size: 7
      },
    
      // 公告相关
      notice: {
        enabled: true,
        sse_enabled: false,
        dismissed_level: 'session'
      }
    },

    // ===== admin 后台 =====
    admin: {
      article: {
        // 轮播数量
        carousel_limit: 3,
      }
    },
  }),

  actions: {
    // ==================== 核心：动态读写 ====================

    /**
     * 按 key 读取配置值，通过 _keyToGroup 自动定位所属 group
     * @param {string} key — 如 'comment.article_comment_enabled'
     * @returns {any}
     */
    getValue(key) {
      const gk = _keyToGroup[key]
      if (gk) return deepGet(this, [gk, ...key.split('.')])
      // 未在 _groupKeys 中声明 → 遍历所有 group 查找（兜底）
      for (const g of ['client', 'admin', 'user']) {
        const val = deepGet(this, [g, ...key.split('.')])
        if (val !== undefined) return val
      }
      return undefined
    },

    /**
     * 本地设置配置值（不调 API，纯 state 更新）
     * @param {string} key — 如 'comment.article_comment_enabled'
     * @param {any} value
     */
    setValue(key, value) {
      const gk = _keyToGroup[key]
      if (gk) deepSet(this, [gk, ...key.split('.')], value)
    },

    // ==================== 加载 ====================

    /**
     * 加载所有配置
     */
    async loadConfig() {
      this.loading = true
      try {
        const res = await getConfigApi()
        if (res.code === 200 && res.data) {
          // res.data = { client:{...}, admin:{...}, user:{...} }
          for (const gk of Object.keys(res.data)) {
            if (gk in this.$state) {
              this.$state[gk] = res.data[gk]
            }
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      } finally {
        this.loading = false
      }
    },

    // ==================== 专用方法（thin wrapper，全部调 getValue） ====================

    /**
     * 获取轮播数量限制
     */
    getCarouselLimit(){
      return this.getValue('article.carousel_limit') ?? 3
    },

    /**
     * 获取友链是否启用
     */
    getFriendLinkEnabled(){
      return this.getValue('nav.friend_link_enabled') === true
    },

    /**
     * 获取关于页面是否启用
     */
    getAboutEnabled(){
      return this.getValue('nav.about_enabled') === true
    },

    /**
     * 获取登录是否启用
     */
    getUserLoginEnabled(){
      return this.getValue('user.login_enabled') === true
    },

    /**
     * 获取其他登录是否启用
     */
    getUserOtherLoginEnabled(){
      return this.getValue('user.other_login_enabled') === true
    },

    /**
     * 获取文章评论是否启用
     */
    getArticleCommentEnabled() {
      return this.getValue('comment.article_comment_enabled') === true
    },

    /**
     * 获取友链评论是否启用
     */
    getFriendLinkCommentEnabled(){
      return this.getValue('comment.friend_link_comment_enabled') === true
    },

    /**
     * 根据评论类型获取评论是否启用
     * @param {String} commentType 评论类型（'article' 或 'friendLink'）
     * @returns {Boolean}
     */
    isCommentTypeEnabled(commentType) {
      if (commentType === 'friendLink') {
        return this.getFriendLinkCommentEnabled()
      }
      // 默认为文章评论
      return this.getArticleCommentEnabled()
    },

    /**
     * 根据评论类型和文章自身的评论开关，综合判断评论是否启用
     * @param {String} commentType 评论类型（'article' 或 'friendLink'）
     * @param {String|Number} isComment 文章自身的评论开关（'1'开启，'0'关闭），仅 commentType='article' 时有效
     * @returns {Boolean}
     */
    isCommentTypeEnabledWithExtra(commentType, isComment) {
      // 1. 先检查全局开关
      const globalEnabled = this.isCommentTypeEnabled(commentType)
      if (!globalEnabled) return false

      // 2. 如果是文章评论，额外检查文章自身的 isComment
      if (commentType === 'article') {
        // isComment 为 '1' 表示允许评论
        return isComment === '1' || isComment === 1 || isComment === true
      }

      // 3. 友链评论直接返回全局开关结果
      return globalEnabled
    },


    /**
     * 🎯 获取子评论默认显示数量
     */
    getChildCommentLimit() {
      return this.getValue('comment.child_comment_limit') ?? 3
    },

    /**
     * 🎯 获取子评论分页大小
     */
    getChildPageSize() {
      return this.getValue('comment.child_page_size') ?? 7
    },

    /**
     *  获取父评论分页大小
     */
    getParentPageSize(){
      return this.getValue('comment.parent_page_size') ?? 10
    },

    /**
     *  获取我的反馈是否开启
     */
    getMyFeedbackEnabled(){
      return this.getValue('profile.my_feedback_enabled') ?? true
    },

    /**
     *  获取我的发布是否开启
     */
    getPublishesEnabled(){
      return this.getValue('profile.my_publishes_enabled') ?? true
    },

    /**
     *  获取我的评论是否开启
     */
    getMyCommentsEnabled(){
      return this.getValue('profile.my_comments_enabled') ?? true
    },

    /**
     *  获取我的收藏是否开启
     */
    getMyFavoritesEnabled(){
      return this.getValue('profile.my_favorites_enabled') ?? true
    },

    /**
     * 获取文章主题名称
     */
    getArticleTheme() {
      return this.getValue('article_detail.theme') === 0 ? 'github' : 'vuepress'
    },

    /**
     * 获取文章锚点是否启用
     */
    getAnchorEnabled() {
      return this.getValue('article_detail.anchor_enabled') ?? true
    },

    /**
     * 获取文章收藏数是否启用
     */
    getFavoriteCountEnabled(){
      return this.getValue('article_detail.favorite_count_enabled') ?? true
    },

    /**
     * 获取文章列表浏览是否启用
     */
    getListViewEnabled(){
      return this.getValue('article_list.view_enabled') ?? true
    },

    /**
     * 获取文章列表收藏是否启用
     */
    getListFavoriteEnabled(){
      return this.getValue('article_list.favorite_enabled') ?? true
    },

    /**
     * 获取文章列表评论是否启用
     */
    getListCommentEnabled(){
      return this.getValue('article_list.comment_enabled') ?? true
    },

    /**
     * 获取文章列表加载方式
     */
    getListLoadMode(){
      return this.getValue('article_list.load_mode')
    },

    /**
     * 获取滚动模式分页大小
     */
    getListScrollPageSize(){
      return this.getValue('article_list.scroll_page_size') ?? 10
    },

    /**
     * 获取分页模式分页大小
     */
    getListPaginationPageSize(){
      return this.getValue('article_list.pagination_page_size') ?? 7
    },

    /**
     *
     * 获取 websocket 连接
     */
    getWebsocketEnabled(){
      return this.getValue('websocket.enabled') ?? true
    },

    /**
     *
     * 获取 websocket 后端连接
     */
    getWebsocketBackendEnabled(){
      return this.getValue('websocket.backend_enabled') === true
    },

    /**
     * 获取公告开关
     */
    getNoticeEnabled(){
      return this.getValue('notice.enabled') ?? true
    },

    /**
     * 获取公告 SSE 实时连接开关
     */
    getNoticeSseEnabled(){
      return this.getValue('notice.sse_enabled') === true
    },

    /**
     * 获取公告不再提示级别
     */
    getNoticeDismissedLevel(){
      return this.getValue('notice.dismissed_level') || 'session'
    }

  },

  getters: {
    carouselLimit()          { return this.getValue('article.carousel_limit') ?? 3 },
    isNavFriendLinkEnabled()  { return this.getValue('nav.friend_link_enabled') === true },
    isNavAboutEnabled()       { return this.getValue('nav.about_enabled') === true },
    isUserLoginEnabled()      { return this.getValue('user.login_enabled') === true },
    isUserOtherLoginEnabled() { return this.getValue('user.other_login_enabled') === true },
    isArticleCommentEnabled()    { return this.getValue('comment.article_comment_enabled') === true },
    isFriendLinkCommentEnabled() { return this.getValue('comment.friend_link_comment_enabled') === true },
    childCommentLimit()       { return this.getValue('comment.child_comment_limit') ?? 3 },
    childPageSize()           { return this.getValue('comment.child_page_size') ?? 7 },
    parentPageSize()          { return this.getValue('comment.parent_page_size') ?? 10 },
    isMyFeedbackEnabled()     { return this.getValue('profile.my_feedback_enabled') ?? true },
    isMyPublishesEnabled()    { return this.getValue('profile.my_publishes_enabled') ?? true },
    isMyCommentsEnabled()     { return this.getValue('profile.my_comments_enabled') ?? true },
    isMyFavoritesEnabled()    { return this.getValue('profile.my_favorites_enabled') ?? true },
    currentArticleTheme()     { return this.getValue('article_detail.theme') === 0 ? 'github' : 'vuepress' },
    isAnchorEnabled()         { return this.getValue('article_detail.anchor_enabled') ?? true },
    isFavoriteCountEnabled()  { return this.getValue('article_detail.favorite_count_enabled') ?? true },
    isListViewEnabled()       { return this.getValue('article_list.view_enabled') ?? true },
    isListFavoriteEnabled()   { return this.getValue('article_list.favorite_enabled') ?? true },
    isListCommentEnabled()    { return this.getValue('article_list.comment_enabled') ?? true },
    currentListLoadMode()     { return this.getValue('article_list.load_mode') === 'scroll' ? 'scroll' : 'pagination' },
    scrollPageSize()          { return this.getValue('article_list.scroll_page_size') ?? 10 },
    paginationPageSize()      { return this.getValue('article_list.pagination_page_size') ?? 7 },
    isWebsocketEnabled()      { return this.getValue('websocket.enabled') ?? true },
    isWebsocketBackendEnabled()      { return this.getValue('websocket.backend_enabled') === true },
    isNoticeEnabled()         { return this.getValue('notice.enabled') ?? true },
    isNoticeSseEnabled()      { return this.getValue('notice.sse_enabled') === true },
    isNoticeDismissedLevel()  { return this.getValue('notice.dismissed_level') === 'session' ? 'session' : 'permanent' },
  }
})
