// ============================================================
// 依赖导入
// ============================================================
import { defineStore } from "pinia"
import { getConfigApi, updateConfigValueApi } from "@/api/config"
import { useIconStore } from "./icon"
import msg from '@/components/msg'

// ============================================================
// 配置项元数据 — 由 configItems.js 调用 registerItems() 注入
// configStore 自身不定义任何 key，全部从 configItems 读取
// _itemMap[key] = { type, label, options, sys, group }
// ============================================================
const _itemMap = {}

/**
 * 注册配置项元数据。configItems.js 在模块初始化时调用。
 * @param {Array<{key:string, type:string, label:string, options?:Array, sys?:boolean}>} items
 * @param {string} groupKey — 所属分组 key（client / admin / user）
 */
export function registerItems(items, groupKey) {
  for (const it of (items || [])) {
    _itemMap[it.key] = { type: it.type, label: it.label, options: it.options, sys: it.sys, group: groupKey }
  }
}

function _item(key) { return _itemMap[key] || {} }

// ============================================================
// number 型配置项的默认 min/max
// ============================================================
const DEFAULT_NUMBER_LIMITS = {
  'comment.child_comment_limit':              { min: 0, max: 20 },
  'comment.child_page_size':                  { min: 5, max: 50 },
  'comment.parent_page_size':                 { min: 5, max: 15 },
  'article.top_limit':                        { min: 1, max: 99 },
  'article.carousel_limit':                   { min: 0, max: 99 },
  'article_list.scroll_page_size':            { min: 5, max: 15 },
  'article_list.pagination_page_size':        { min: 5, max: 15 },
  'storage.data_retention_days':              { min: 0, max: 100 },
  'storage.file_retention_days':              { min: 0, max: 100 },
  'tree.cate.parent_width':                   { min: 12, max: 200 },
}

// ============================================================
// 工具函数 — 深层读写
// ============================================================

/** 深层读取 obj 中 path 路径的值 */
function deepGet(obj, path) {
  let cur = obj
  for (const k of path) {
    if (cur == null) return undefined
    cur = cur[k]
  }
  return cur
}

/** 深层写入 obj 中 path 路径的值，自动创建中间对象 */
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

// ============================================================
// Pinia Store
// ============================================================
export const useConfigStore = defineStore({
  id: 'config',

  // ============================================================
  // 数据 — 以 group（client / admin / user）为顶层 key，与后端结构对齐
  // ============================================================
  state: () => ({
    loading: false,
    numberLimits: {},

    // ===== client 前台 =====
    client: {
      comment: {
        article_comment_enabled: true,
        friend_link_comment_enabled: false,
        child_comment_limit: 3,
        child_page_size: 10,
        parent_page_size: 10,
      },
      nav: {
        friend_link_enabled: false,
        about_enabled: false,
      },
      user: {
        login_enabled: true,
        other_login_enabled: false,
      },
      profile: {
        my_feedback_enabled: false,
        my_publishes_enabled: false,
        my_comments_enabled: true,
        my_favorites_enabled: true,
      },
      article_detail: {
        theme: 0,
        anchor_enabled: true,
        favorite_count_enabled: true,
      },
      article_list: {
        view_enabled: true,
        favorite_enabled: true,
        comment_enabled: true,
        load_mode: 'scroll',
        scroll_page_size: 10,
        pagination_page_size: 7,
      },
      websocket: {
        enabled: true,
        backend_enabled: false,
      },
      notice: {
        enabled: false,
        sse_enabled: false,
        dismissed_level: 'session',
      },
    },

    // ===== admin 后台 =====
    admin: {
      article: {
        top_limit: 3,
        carousel_limit: 3,
        save_edit: false,
      },
      icon_enabled: true,
      button_permission_mode: 'hide',
      collapse_search_enabled: false,
      config_view_mode: 'card',
      tag_view_mode: 'card',
      search_menu_focus: false,
      theme_layout_mode: 'inline',
      theme_dot_shape: 'circle',
      tree: {
        auth: {
          line_style: 'dashed',
          child_mode: 'fill',
        },
        cate: {
          line_style: 'dashed',
          parent_mode: 'custom',
          parent_width: 75,
          child_mode: 'fill',
        },
      },
      notification: {
        comment_enabled: true,
      },
      storage: {
        data_retention_days: 30,
        file_retention_days: 7,
        log_retention_days: 7,
      },
      logo: {
        admin_dark_logo: 'neon',
        hide_image: false,
        user_light_logo: 'stroke-scan',
        admin_light_logo: 'stroke-scan',
      },
      dashboard: {
        top_card_enabled: false,
        line_chart: {
          y_valid_field: 'all',
          priority: 'data',
          week_offset: 12,
        },
      },
    },

    // ===== user_config 用户配置 =====
    user_config: {
        collapse_enabled: false,
        dark_enabled: false,
        theme: 'default',
    },
  }),

  // ============================================================
  // 方法
  // ============================================================
  actions: {

    // ==================== 元数据 & 工具 ====================

    /** 判断是否为系统字段 */
    isSystemConfig(key) {
      return _item(key).sys === true
    },

    /** 获取配置项的元数据 */
    getConfigDefinition(key) {
      const it = _item(key)
      return it.type ? it : undefined
    },

    /** 初始化数字限制 */
    initNumberLimits() {
      for (const [key, lim] of Object.entries(DEFAULT_NUMBER_LIMITS)) {
        this.numberLimits[key] = { ...lim }
      }
    },

    /** 设置数字配置项的限制范围 */
    setNumberLimit(key, min, max) {
      if (!this.numberLimits[key]) this.numberLimits[key] = {}
      if (min !== undefined && min !== null) this.numberLimits[key].min = min
      if (max !== undefined && max !== null) this.numberLimits[key].max = max
    },

    /** 获取数字配置项的限制范围 */
    getNumberLimit(key) {
      return this.numberLimits[key] || { min: undefined, max: undefined }
    },

    /** 获取源码默认阈值（DEFAULT_NUMBER_LIMITS 中定义，未定义返回 undefined） */
    getDefaultNumberLimit(key) {
      return DEFAULT_NUMBER_LIMITS[key]
    },

    /** 删除数字配置项的限制范围 */
    removeNumberLimit(key) {
      delete this.numberLimits[key]
    },

    /** 获取限制最小值 */
    getLimitMin(key) {
      return this.numberLimits[key]?.min
    },

    /** 获取限制最大值 */
    getLimitMax(key) {
      return this.numberLimits[key]?.max
    },

    // ==================== 核心：通用读写 ====================

    /**
     * 按 configItems 中的 key 读取配置值
     * 通过 _itemMap 定位所属 group，拼接完整 state 路径
     * @param {string} key — configItems 中定义的 key（如 'comment.article_comment_enabled'）
     * @returns {any}
     */
    getValue(key) {
      const item = _itemMap[key]
      if (item?.group) {
        return deepGet(this, [item.group, ...key.split('.')])
      }
      // _itemMap 未填充时（非配置页面直接访问），回退到遍历 group 查找
      for (const gk of ['client', 'admin', 'user_config']) {
        const val = deepGet(this, [gk, ...key.split('.')])
        if (val !== undefined) return val
      }
      return undefined
    },

    /**
     * 本地设置配置值（不调 API，仅更新 store state）
     * @param {string} key — configItems 中定义的 key
     * @param {any} value — 新值
     */
    setValue(key, value) {
      const item = _itemMap[key]
      if (item?.group) {
        deepSet(this, [item.group, ...key.split('.')], value)
        return
      }
      // _itemMap 未填充时，回退到遍历 group 查找已有 key
      for (const gk of ['client', 'admin', 'user_config']) {
        const path = [gk, ...key.split('.')]
        if (deepGet(this, path) !== undefined) {
          deepSet(this, path, value)
          return
        }
      }
    },

    // ==================== 核心：加载 & 更新 ====================

    /** 加载所有配置 */
    async loadConfig() {
      this.loading = true
      try {
        const res = await getConfigApi()
        if (res.code === 200 && res.data) {
          // res.data = { client: {...}, admin: {...}, user: {...}, 及可能的孤儿 key }
          for (const gk of Object.keys(res.data)) {
            this.$state[gk] = res.data[gk]
          }
          this.executeInit()
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        msg.error('加载配置失败')
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新单个配置项
     * @param {string} key 配置 key（configItems 中定义的 key，如 'comment.article_comment_enabled'）
     * @param {any} value 新值
     * @param {boolean} silent 静默模式，不显示提示消息（程序化联动场景用）
     */
    async updateConfig(key, value, silent = false) {
      let item = _itemMap[key] || {}
      if (!item.type) {
        // _itemMap 未填充时，回退到遍历 group 查找并补全 item
        for (const gk of ['client', 'admin', 'user_config']) {
          const path = [gk, ...key.split('.')]
          if (deepGet(this, path) !== undefined) {
            item = { type: 'unknown', label: key, group: gk }
            break
          }
        }
        if (!item.group) {
          console.error(`未找到配置项: ${key}`)
          return
        }
      }

      // 拼接完整 API key：group.key（如 client.comment.article_comment_enabled）
      const apiKey = `${item.group}.${key}`

      try {
        const res = await updateConfigValueApi(apiKey, value)
        if (res.code === 200) {
          // 本地更新
          deepSet(this, [item.group, ...key.split('.')], value)
          if (!silent) this.showMessage(key, value)
          this.executeInit()
        } else {
          await this.loadConfig()
        }
      } catch (error) {
        console.error('更新配置失败:', error)
        await this.loadConfig()
      }
    },

    /**
     * 显示提示消息
     * @param {string} key — configItems key
     * @param {any} value — 新值
     */
    showMessage(key, value) {
      const item = _itemMap[key]
      if (!item) return

      let message = ''
      if (item.type === 'switch') {
        message = value ? `${item.label}已开启` : `${item.label}已禁用`
      } else if (item.type === 'radio' || item.type === 'string') {
        const opt = item.options?.find(o => o.value === value)
        message = opt ? `${item.label}已切换为 ${opt.label}` : `${item.label}已切换`
      } else if (item.type === 'number') {
        message = `${item.label}已设为 ${value}`
      } else {
        message = `${item.label}已更新`
      }

      msg.primary(message)
    },

    /**
     * 批量更新配置
     */
    async batchUpdateConfig(configData) {
      for (const gk of Object.keys(configData)) {
        if (gk in this.$state) {
          this.$state[gk] = configData[gk]
        }
      }
      this.executeInit()
    },

    /**
     * 执行初始化逻辑
     */
    executeInit() {
      if (this.getValue('icon_enabled') === true) {
        const iconStore = useIconStore()
        iconStore.resetIconConditions()
      }
    },

    // ==================== 专用 getter / setter / toggle（thin wrapper） ====================

    // -- icon_enabled --
    getIconEnabled()               { return this.getValue('icon_enabled') === true },
    toggleIconEnabled()            { this.updateConfig('icon_enabled', !this.getValue('icon_enabled')) },

    // -- button_permission_mode --
    getButtonPermissionMode()      { return this.getValue('button_permission_mode') || 'hide' },
    setButtonPermissionMode(v)     { this.updateConfig('button_permission_mode', v) },

    // -- collapse_search_enabled --
    getCollapseSearchEnabled()     { return this.getValue('collapse_search_enabled') === true },
    toggleCollapseSearchEnabled()  { this.updateConfig('collapse_search_enabled', !this.getValue('collapse_search_enabled')) },

    // -- config_view_mode --
    getConfigViewMode()            { return this.getValue('config_view_mode') || 'card' },
    setConfigViewMode(v)           { this.updateConfig('config_view_mode', v) },

    // -- tag_view_mode --
    getTagViewMode()               { return this.getValue('tag_view_mode') || 'card' },
    setTagViewMode(v)              { this.updateConfig('tag_view_mode', v) },

    // ==================== websocket ====================

    getWebsocketEnabled()          { return this.getValue('websocket.enabled') ?? true },
    toggleWebsocketEnabled()       { this.updateConfig('websocket.enabled', !this.getValue('websocket.enabled')) },

    getWebsocketBackendEnabled()   { return this.getValue('websocket.backend_enabled') === true },
    setWebsocketBackendEnabled(v)  { this.updateConfig('websocket.backend_enabled', v) },

    // ==================== notice ====================

    getNoticeEnabled()             { return this.getValue('notice.enabled') === true },
    toggleNoticeEnabled()          { this.updateConfig('notice.enabled', !this.getValue('notice.enabled')) },

    getNoticeSseEnabled()          { return this.getValue('notice.sse_enabled') === true },
    toggleNoticeSseEnabled()       { this.updateConfig('notice.sse_enabled', !this.getValue('notice.sse_enabled')) },

    getNoticeDismissedLevel()      { return this.getValue('notice.dismissed_level') || 'session' },
    setNoticeDismissedLevel(v)     { this.updateConfig('notice.dismissed_level', v) },

    // -- search_menu_focus --
    getSearchMenuFocus()           { return this.getValue('search_menu_focus') === true },
    toggleSearchMenuFocus()        { this.updateConfig('search_menu_focus', !this.getValue('search_menu_focus')) },

    // -- theme_layout_mode --
    getThemeLayoutMode()           { return this.getValue('theme_layout_mode') || 'float' },
    setThemeLayoutMode(v)          { this.updateConfig('theme_layout_mode', v) },

    // -- theme_dot_shape --
    getThemeDotShape()             { return this.getValue('theme_dot_shape') || 'circle' },
    setThemeDotShape(v)            { this.updateConfig('theme_dot_shape', v) },

    // ==================== tree ====================

    getTreeAuthLineStyle()         { return this.getValue('tree.auth.line_style') || 'dashed' },
    setTreeAuthLineStyle(v)        { this.updateConfig('tree.auth.line_style', v) },

    getTreeAuthChildMode()         { return this.getValue('tree.auth.child_mode') || 'fill' },
    setTreeAuthChildMode(v)        { this.updateConfig('tree.auth.child_mode', v) },

    getTreeCateLineStyle()         { return this.getValue('tree.cate.line_style') || 'dashed' },
    setTreeCateLineStyle(v)        { this.updateConfig('tree.cate.line_style', v) },

    getTreeCateParentMode()        { return this.getValue('tree.cate.parent_mode') || 'custom' },
    setTreeCateParentMode(v)       { this.updateConfig('tree.cate.parent_mode', v) },

    getTreeCateParentWidth()       { return this.getValue('tree.cate.parent_width') ?? 75 },
    setTreeCateParentWidth(v)      { this.updateConfig('tree.cate.parent_width', v) },

    getTreeCateChildMode()         { return this.getValue('tree.cate.child_mode') || 'fill' },
    setTreeCateChildMode(v)        { this.updateConfig('tree.cate.child_mode', v) },

    // ==================== article ====================

    getArticleTopLimit()           { return this.getValue('article.top_limit') ?? 3 },
    setArticleTopLimit(v)          { this.updateConfig('article.top_limit', v) },

    getArticleCarouselLimit()      { return this.getValue('article.carousel_limit') ?? 3 },
    setArticleCarouselLimit(v)     { this.updateConfig('article.carousel_limit', v) },

    getArticleSaveEdit()           { return this.getValue('article.save_edit') === true },
    toggleArticleSaveEdit()        { this.updateConfig('article.save_edit', !this.getValue('article.save_edit')) },

    // ==================== comment ====================

    getArticleCommentEnabled()     { return this.getValue('comment.article_comment_enabled') ?? true },
    toggleArticleCommentEnabled()  { this.updateConfig('comment.article_comment_enabled', !this.getValue('comment.article_comment_enabled')) },

    getFriendLinkCommentEnabled()  { return this.getValue('comment.friend_link_comment_enabled') ?? true },
    toggleFriendLinkCommentEnabled() { this.updateConfig('comment.friend_link_comment_enabled', !this.getValue('comment.friend_link_comment_enabled')) },

    getChildCommentLimit()         { return this.getValue('comment.child_comment_limit') ?? 3 },
    setChildCommentLimit(v)        { this.updateConfig('comment.child_comment_limit', v) },

    getChildPageSize()             { return this.getValue('comment.child_page_size') ?? 7 },
    setChildPageSize(v)            { this.updateConfig('comment.child_page_size', v) },

    getParentPageSize()            { return this.getValue('comment.parent_page_size') ?? 10 },
    setParentPageSize(v)           { this.updateConfig('comment.parent_page_size', v) },

    // ==================== nav ====================

    getFriendLinkEnabled()         { return this.getValue('nav.friend_link_enabled') === true },
    toggleFriendLinkEnabled()      { this.updateConfig('nav.friend_link_enabled', !this.getValue('nav.friend_link_enabled')) },

    getAboutEnabled()              { return this.getValue('nav.about_enabled') === true },
    toggleAboutEnabled()           { this.updateConfig('nav.about_enabled', !this.getValue('nav.about_enabled')) },

    // ==================== user（前台认证） ====================

    getUserLoginEnabled()          { return this.getValue('user.login_enabled') === true },
    toggleUserLoginEnabled()       { this.updateConfig('user.login_enabled', !this.getValue('user.login_enabled')) },

    getUserOtherLoginEnabled()     { return this.getValue('user.other_login_enabled') === true },
    toggleUserOtherLoginEnabled()  { this.updateConfig('user.other_login_enabled', !this.getValue('user.other_login_enabled')) },

    // ==================== profile ====================

    getMyFeedbackEnabled()         { return this.getValue('profile.my_feedback_enabled') ?? true },
    toggleMyFeedbackEnabled()      { this.updateConfig('profile.my_feedback_enabled', !this.getValue('profile.my_feedback_enabled')) },

    getMyPublishesEnabled()        { return this.getValue('profile.my_publishes_enabled') ?? true },
    toggleMyPublishesEnabled()     { this.updateConfig('profile.my_publishes_enabled', !this.getValue('profile.my_publishes_enabled')) },

    getMyCommentsEnabled()         { return this.getValue('profile.my_comments_enabled') ?? true },
    toggleMyCommentsEnabled()      { this.updateConfig('profile.my_comments_enabled', !this.getValue('profile.my_comments_enabled')) },

    getMyFavoritesEnabled()        { return this.getValue('profile.my_favorites_enabled') ?? true },
    toggleMyFavoritesEnabled()     { this.updateConfig('profile.my_favorites_enabled', !this.getValue('profile.my_favorites_enabled')) },

    // ==================== article_detail ====================

    getArticleTheme()              { return this.getValue('article_detail.theme') },
    setArticleTheme(v)             { this.updateConfig('article_detail.theme', v) },

    getAnchorEnabled()             { return this.getValue('article_detail.anchor_enabled') ?? true },
    toggleAnchorEnabled()          { this.updateConfig('article_detail.anchor_enabled', !this.getValue('article_detail.anchor_enabled')) },

    getFavoriteCountEnabled()      { return this.getValue('article_detail.favorite_count_enabled') ?? true },
    toggleFavoriteCountEnabled()   { this.updateConfig('article_detail.favorite_count_enabled', !this.getValue('article_detail.favorite_count_enabled')) },

    // ==================== article_list ====================

    getListViewEnabled()           { return this.getValue('article_list.view_enabled') ?? true },
    toggleListViewEnabled()        { this.updateConfig('article_list.view_enabled', !this.getValue('article_list.view_enabled')) },

    getListFavoriteEnabled()       { return this.getValue('article_list.favorite_enabled') ?? true },
    toggleListFavoriteEnabled()    { this.updateConfig('article_list.favorite_enabled', !this.getValue('article_list.favorite_enabled')) },

    getListCommentEnabled()        { return this.getValue('article_list.comment_enabled') ?? true },
    toggleListCommentEnabled()     { this.updateConfig('article_list.comment_enabled', !this.getValue('article_list.comment_enabled')) },

    getListLoadMode()              { return this.getValue('article_list.load_mode') },
    setListLoadMode(v)             { this.updateConfig('article_list.load_mode', v) },

    getListScrollPageSize()        { return this.getValue('article_list.scroll_page_size') ?? 10 },
    setListScrollPageSize(v)       { this.updateConfig('article_list.scroll_page_size', v) },

    getListPaginationPageSize()    { return this.getValue('article_list.pagination_page_size') ?? 7 },
    setListPaginationPageSize(v)   { this.updateConfig('article_list.pagination_page_size', v) },

    // ==================== notification ====================

    getNotificationCommentEnabled()   { return this.getValue('notification.comment_enabled') ?? true },
    toggleNotificationCommentEnabled(){ this.updateConfig('notification.comment_enabled', !this.getValue('notification.comment_enabled')) },

    // ==================== user_config ====================

    getUserCollapseEnabled()       { return this.getValue('collapse_enabled') ?? true },
    toggleUserCollapseEnabled()    { this.updateConfig('collapse_enabled', !this.getValue('collapse_enabled')) },

    getUserDarkEnabled()           { return this.getValue('dark_enabled') ?? true },
    toggleUserDarkEnabled()        { this.updateConfig('dark_enabled', !this.getValue('dark_enabled')) },

    getUserConfigTheme()           { return this.getValue('theme') || 'default' },
    setUserConfigTheme(v)          { this.updateConfig('theme', v) },

    // ==================== storage ====================

    getStorageDataRetentionDays()  { return this.getValue('storage.data_retention_days') ?? 30 },
    setStorageDataRetentionDays(v) { this.updateConfig('storage.data_retention_days', v) },

    getStorageFileRetentionDays()  { return this.getValue('storage.file_retention_days') ?? 7 },
    setStorageFileRetentionDays(v) { this.updateConfig('storage.file_retention_days', v) },

    getStorageLogRetentionDays()   { return this.getValue('storage.log_retention_days') ?? 7 },
    setStorageLogRetentionDays(v)  { this.updateConfig('storage.log_retention_days', v) },

    // ==================== logo ====================

    getAdminDarkLogo()             { return this.getValue('logo.admin_dark_logo') || 'neon' },
    setAdminDarkLogo(v, silent = false) { this.updateConfig('logo.admin_dark_logo', v, silent) },

    getLogoHideImage()             { return this.getValue('logo.hide_image') === true },
    toggleLogoHideImage()          { this.updateConfig('logo.hide_image', !this.getValue('logo.hide_image')) },

    getUserLightLogo()             { return this.getValue('logo.user_light_logo') || 'stroke-scan' },
    setUserLightLogo(v)            { this.updateConfig('logo.user_light_logo', v) },

    getAdminLightLogo()            { return this.getValue('logo.admin_light_logo') || 'stroke-scan' },
    setAdminLightLogo(v)           { this.updateConfig('logo.admin_light_logo', v) },

    // ==================== dashboard.line_chart ====================

    getDashboardLineChartYValidField()  { return this.getValue('dashboard.line_chart.y_valid_field') },
    setDashboardLineChartYValidField(v) { this.updateConfig('dashboard.line_chart.y_valid_field', v) },

    getDashboardLineChartPriority()     { return this.getValue('dashboard.line_chart.priority') },
    setDashboardLineChartPriority(v)    { this.updateConfig('dashboard.line_chart.priority', v) },

    getDashboardLineChartWeekOffset()   { return this.getValue('dashboard.line_chart.week_offset') },
    setDashboardLineChartWeekOffset(v)  { this.updateConfig('dashboard.line_chart.week_offset', v) },

    // ==================== dashboard ====================

    getDashboardTopCardEnabled()   { return this.getValue('dashboard.top_card_enabled') === true },
    toggleDashboardTopCardEnabled(){ this.updateConfig('dashboard.top_card_enabled', !this.getValue('dashboard.top_card_enabled')) },
  },

  // ============================================================
  // 计算属性 — 使用 this.getValue() 动态解析
  // ============================================================
  getters: {
    // ===== 顶层（admin 组） =====
    buttonPermissionMode()    { return this.getValue('button_permission_mode') || 'hide' },
    isCollapseSearchEnabled() { return this.getValue('collapse_search_enabled') === true },
    configViewMode()          { return this.getValue('config_view_mode') || 'card' },
    tagViewMode()             { return this.getValue('tag_view_mode') || 'card' },
    isWebsocketEnabled()        { return this.getValue('websocket.enabled') === true },
    isWebsocketBackendEnabled() { return this.getValue('websocket.backend_enabled') === true },
    isNoticeEnabled()         { return this.getValue('notice.enabled') === true },
    isNoticeSseEnabled()      { return this.getValue('notice.sse_enabled') === true },
    noticeDismissedLevel()    { return this.getValue('notice.dismissed_level') || 'session' },
    isSearchMenuFocus()       { return this.getValue('search_menu_focus') === true },
    themeLayoutMode()         { return this.getValue('theme_layout_mode') || 'float' },
    themeDotShape()           { return this.getValue('theme_dot_shape') || 'circle' },
    treeAuthLineStyle()       { return this.getValue('tree.auth.line_style') || 'dashed' },
    treeCateLineStyle()       { return this.getValue('tree.cate.line_style') || 'dashed' },
    treeCateParentMode()      { return this.getValue('tree.cate.parent_mode') || 'custom' },
    treeCateParentWidth()     { return this.getValue('tree.cate.parent_width') ?? 75 },
    treeCateChildMode()       { return this.getValue('tree.cate.child_mode') || 'fill' },
    treeAuthChildMode()       { return this.getValue('tree.auth.child_mode') || 'fill' },

    // ===== article (admin 组) =====
    articleTopLimit()         { return this.getValue('article.top_limit') ?? 3 },
    articleCarouselLimit()    { return this.getValue('article.carousel_limit') ?? 3 },
    isArticleSaveEdit()       { return this.getValue('article.save_edit') === true },

    // ===== comment (client 组) =====
    isArticleCommentEnabled()    { return this.getValue('comment.article_comment_enabled') === true },
    isFriendLinkCommentEnabled() { return this.getValue('comment.friend_link_comment_enabled') === true },

    // ===== user 前台认证 (client 组) =====
    isUserLoginEnabled()      { return this.getValue('user.login_enabled') === true },
    isUserOtherLoginEnabled() { return this.getValue('user.other_login_enabled') === true },

    // ===== profile (client 组) =====
    isMyFeedbackEnabled()     { return this.getValue('profile.my_feedback_enabled') ?? true },
    isMyPublishesEnabled()    { return this.getValue('profile.my_publishes_enabled') ?? true },
    isMyCommentsEnabled()     { return this.getValue('profile.my_comments_enabled') ?? true },
    isMyFavoritesEnabled()    { return this.getValue('profile.my_favorites_enabled') ?? true },

    // ===== article_detail (client 组) =====
    currentArticleTheme()     { const v = this.getValue('article_detail.theme'); return v === 0 ? 'github' : 'vuepress' },
    isAnchorEnabled()         { return this.getValue('article_detail.anchor_enabled') ?? true },
    isFavoriteCountEnabled()  { return this.getValue('article_detail.favorite_count_enabled') ?? true },

    // ===== article_list (client 组) =====
    isListViewEnabled()       { return this.getValue('article_list.view_enabled') ?? true },
    isListFavoriteEnabled()   { return this.getValue('article_list.favorite_enabled') ?? true },
    isListCommentEnabled()    { return this.getValue('article_list.comment_enabled') ?? true },

    // ===== notification (admin 组) =====
    isNotificationCommentEnabled() { return this.getValue('notification.comment_enabled') ?? true },

    // ===== user_config (user 组) =====
    isUserCollapseEnabled()   { return this.getValue('collapse_enabled') ?? true },
    isUserDarkEnabled()       { return this.getValue('dark_enabled') ?? true },
    userConfigTheme()         { return this.getValue('theme') || 'default' },

    // ===== logo (admin 组) =====
    adminDarkLogo()           { return this.getValue('logo.admin_dark_logo') || 'neon' },
    isLogoImageHidden()       { return this.getValue('logo.hide_image') === true },
    userLightLogo()           { return this.getValue('logo.user_light_logo') || 'stroke-scan' },
    adminLightLogo()          { return this.getValue('logo.admin_light_logo') || 'stroke-scan' },

    // ===== storage (admin 组) =====
    storageDataRetentionDays() { return this.getValue('storage.data_retention_days') ?? 30 },
    storageFileRetentionDays() { return this.getValue('storage.file_retention_days') ?? 7 },
    storageLogRetentionDays()  { return this.getValue('storage.log_retention_days') ?? 7 },

    // ===== line_config (admin 组) =====
    dashboardLineChartYValidField() { return this.getValue('dashboard.line_chart.y_valid_field') },
    dashboardLineChartPriority()    { return this.getValue('dashboard.line_chart.priority') },
    dashboardLineChartWeekOffset()  { return this.getValue('dashboard.line_chart.week_offset') },

    // ===== dashboard (admin 组) =====
    isDashboardTopCardEnabled() { return this.getValue('dashboard.top_card_enabled') === true },
  },

  // ============================================================
  // 持久化
  // ============================================================
  persist: {
    key: 'scorpion-config',
    paths: ['numberLimits']
  },
})
