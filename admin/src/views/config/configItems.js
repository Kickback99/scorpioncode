/**
 * 配置项数据定义 — 所有配置界面变体的唯一数据源
 *
 * 扩展方式：在对应 groups 的 items 数组中增删条目即可，
 * 所有变体组件（分栏/折叠面板/折叠行内列表）自动同步。
 *
 * item.key 与后端 key 一致（不含 group 前缀，如 'comment.article_comment_enabled'），
 * group 前缀由 configStore 根据分组自动拼接。
 */
import { useRenderIcon } from '@/components/MyIcon/src/hook'
import { useConfigStore, registerItems } from '@/store/config'
import {
  Key, Link, ChatDotSquare, ChatLineSquare, Brush, Connection,
  Aim, Star, ChatDotRound, List, Document, Message, InfoFilled, Postcard, Comment, Collection,
  View, CollectionTag, ChatSquare, Tickets, Bell,
  PictureFilled, DeleteFilled, FolderDelete, Grid, DataBoard, SemiSelect, Sort
} from '@element-plus/icons-vue'

export function useConfigItems() {
  const config = useConfigStore()

  const getMin = (key) => {
    const limit = config.getLimitMin(key)
    return limit !== undefined ? limit : -Infinity
  }
  const getMax = (key) => {
    const limit = config.getLimitMax(key)
    return limit !== undefined ? limit : Infinity
  }

  const groups = [
    {
      key: 'client', label: '前台', icon: useRenderIcon('ri:xbox-fill'),
      items: [
        // ===== comment =====
        { key: 'comment.article_comment_enabled',    type: 'switch', label: '文章评论',       sys: true,       desc: '开启后文章详情页显示评论区',            icon: ChatDotSquare,  get: () => config.getValue('comment.article_comment_enabled'),     set: (v) => config.updateConfig('comment.article_comment_enabled', v) },
        { key: 'comment.friend_link_comment_enabled', type: 'switch', label: '友链评论',       desc: '开启后友链页显示评论区',                icon: ChatLineSquare, get: () => config.getValue('comment.friend_link_comment_enabled'),  set: (v) => config.updateConfig('comment.friend_link_comment_enabled', v) },
        { key: 'comment.child_comment_limit',        type: 'number', label: '子评论默认显示数量', sys: true, desc: '超过此数量显示「查看更多」按钮',       icon: ChatDotRound,   get: () => config.getValue('comment.child_comment_limit'),          set: (v) => config.updateConfig('comment.child_comment_limit', v),       min: () => getMin('comment.child_comment_limit'), max: () => getMax('comment.child_comment_limit') },
        { key: 'comment.child_page_size',            type: 'number', label: '子评论分页大小', sys: true, desc: '点击查看更多时每次加载的数量',          icon: List,           get: () => config.getValue('comment.child_page_size'),              set: (v) => config.updateConfig('comment.child_page_size', v),           min: () => getMin('comment.child_page_size'),     max: () => getMax('comment.child_page_size') },
        { key: 'comment.parent_page_size',           type: 'number', label: '父评论分页大小', desc: '每次滚动加载父评论的分页大小',          icon: Document,       get: () => config.getValue('comment.parent_page_size'),             set: (v) => config.updateConfig('comment.parent_page_size', v),          min: () => getMin('comment.parent_page_size'),    max: () => getMax('comment.parent_page_size') },
        // ===== nav =====
        { key: 'nav.friend_link_enabled',            type: 'switch', label: '前端友链',       desc: '控制前台友链模块的显示',                icon: Link,           get: () => config.getValue('nav.friend_link_enabled'),         set: (v) => config.updateConfig('nav.friend_link_enabled', v) },
        { key: 'nav.about_enabled',                  type: 'switch', label: '关于页面',       desc: '控制前台关于页面入口的显示',            icon: InfoFilled,     get: () => config.getValue('nav.about_enabled'),               set: (v) => config.updateConfig('nav.about_enabled', v) },
        // ===== user =====
        { key: 'user.login_enabled',                 type: 'switch', label: '前端登录',       sys: true,       desc: '控制前台登录功能的开启与关闭',           icon: "Lock",         get: () => config.getValue('user.login_enabled'),          set: (v) => config.updateConfig('user.login_enabled', v) },
        { key: 'user.other_login_enabled',           type: 'switch', label: '其他登录',       desc: '允许第三方登录方式',                      icon: Key,            get: () => config.getValue('user.other_login_enabled'),      set: (v) => config.updateConfig('user.other_login_enabled', v) },
        // ===== profile =====
        { key: 'profile.my_feedback_enabled',        type: 'switch', label: '我的反馈',       desc: '个人中心显示反馈入口',                    icon: Message,        get: () => config.getValue('profile.my_feedback_enabled'),          set: (v) => config.updateConfig('profile.my_feedback_enabled', v) },
        { key: 'profile.my_publishes_enabled',       type: 'switch', label: '我的发布',       desc: '个人中心显示发布内容入口',                icon: Postcard,       get: () => config.getValue('profile.my_publishes_enabled'),         set: (v) => config.updateConfig('profile.my_publishes_enabled', v) },
        { key: 'profile.my_comments_enabled',        type: 'switch', label: '我的评论',       desc: '个人中心显示评论入口',                    icon: Comment,        get: () => config.getValue('profile.my_comments_enabled'),          set: (v) => config.updateConfig('profile.my_comments_enabled', v) },
        { key: 'profile.my_favorites_enabled',       type: 'switch', label: '我的收藏',       desc: '个人中心显示收藏入口',                    icon: Collection,     get: () => config.getValue('profile.my_favorites_enabled'),         set: (v) => config.updateConfig('profile.my_favorites_enabled', v) },
        // ===== article_detail =====
        { key: 'article_detail.theme',               type: 'radio',  label: '文章主题',       sys: true,       desc: '文章详情页的代码高亮主题风格',            icon: Brush,          get: () => config.getValue('article_detail.theme'),              set: (v) => config.updateConfig('article_detail.theme', v),             options: [{ value: 0, label: 'github' }, { value: 1, label: 'vuepress' }] },
        { key: 'article_detail.anchor_enabled',      type: 'switch', label: '文章锚点',       sys: true,       desc: '自动生成文章标题导航锚点',                icon: Aim,            get: () => config.getValue('article_detail.anchor_enabled'),             set: (v) => config.updateConfig('article_detail.anchor_enabled', v) },
        { key: 'article_detail.favorite_count_enabled',type:'switch',label: '文章收藏数',     desc: '文章列表显示收藏数量',                    icon: Star,           get: () => config.getValue('article_detail.favorite_count_enabled'),       set: (v) => config.updateConfig('article_detail.favorite_count_enabled', v) },
        // ===== article_list =====
        { key: 'article_list.view_enabled',          type: 'switch', label: '列表浏览',       desc: '文章列表支持浏览模式切换',                icon: View,           get: () => config.getValue('article_list.view_enabled'),            set: (v) => config.updateConfig('article_list.view_enabled', v) },
        { key: 'article_list.favorite_enabled',      type: 'switch', label: '列表收藏',       desc: '文章列表显示收藏按钮',                    icon: CollectionTag,  get: () => config.getValue('article_list.favorite_enabled'),        set: (v) => config.updateConfig('article_list.favorite_enabled', v) },
        { key: 'article_list.comment_enabled',       type: 'switch', label: '列表评论',       desc: '文章列表显示评论数',                      icon: ChatSquare,     get: () => config.getValue('article_list.comment_enabled'),         set: (v) => config.updateConfig('article_list.comment_enabled', v) },
        { key: 'article_list.load_mode',             type: 'radio',  label: '文章加载方式',   desc: '列表页文章的加载方式',                    icon: Tickets,        get: () => config.getValue('article_list.load_mode'),              set: (v) => config.updateConfig('article_list.load_mode', v),           options: [{ value: 'scroll', label: '滚动加载' }, { value: 'pagination', label: '分页加载' }] },
        { key: 'article_list.scroll_page_size',      type: 'number', label: '滚动分页大小',   desc: '滚动模式下每次加载的文章数量',            icon: List,           get: () => config.getValue('article_list.scroll_page_size'),         set: (v) => config.updateConfig('article_list.scroll_page_size', v),     min: () => getMin('article_list.scroll_page_size'), max: () => getMax('article_list.scroll_page_size') },
        { key: 'article_list.pagination_page_size',  type: 'number', label: '分页大小',       desc: '分页模式下每页文章数量',                  icon: List,           get: () => config.getValue('article_list.pagination_page_size'),     set: (v) => config.updateConfig('article_list.pagination_page_size', v), min: () => getMin('article_list.pagination_page_size'), max: () => getMax('article_list.pagination_page_size') },
        // ===== websocket =====
        { key: 'websocket.enabled',              type: 'switch', label: 'WebSocket 连接', desc: '控制前端 WebSocket 连接的开启与关闭',      icon: Connection,     get: () => config.getValue('websocket.enabled'),           set: (v) => config.updateConfig('websocket.enabled', v) },
        { key: 'websocket.backend_enabled',      type: 'switch', label: '后端 WebSocket', desc: '后端 WebSocket 连接状态（只读）',          icon: Connection,     get: () => config.getValue('websocket.backend_enabled'), readonly: true },
        // ===== notice =====
        { key: 'notice.enabled',                 type: 'switch', label: '公告通知',       desc: '控制前台公告通知的开启与关闭',            icon: Bell,         get: () => config.getValue('notice.enabled'),              set: (v) => config.updateConfig('notice.enabled', v) },
        { key: 'notice.sse_enabled',             type: 'switch', label: '公告实时连接',   desc: '控制前台公告 SSE 实时推送连接',           icon: Connection,   get: () => config.getValue('notice.sse_enabled'),          set: (v) => config.updateConfig('notice.sse_enabled', v) },
        { key: 'notice.dismissed_level',         type: 'radio',  label: '公告生效级别',   desc: '公告不再提示的生效级别',                  icon: Bell,         get: () => config.getValue('notice.dismissed_level'),      set: (v) => config.updateConfig('notice.dismissed_level', v),     options: [{ value: 'permanent', label: '永久' }, { value: 'session', label: '会话' }] },
      ]
    },
    {
      key: 'admin', label: '后台', icon: useRenderIcon('ri:blender-fill'),
      items: [
        // ===== article =====
        { key: 'article.top_limit',                  type: 'number', label: '文章置顶数量限制', sys: true, desc: '允许同时置顶的最大文章数',               icon: "Top",            get: () => config.getValue('article.top_limit'),            set: (v) => config.updateConfig('article.top_limit', v),                  min: () => getMin('article.top_limit'), max: () => getMax('article.top_limit') },
        { key: 'article.carousel_limit',             type: 'number', label: '轮播图数量限制', sys: true,   desc: '允许上传的最大轮播图数量',                icon: PictureFilled,  get: () => config.getValue('article.carousel_limit'),       set: (v) => config.updateConfig('article.carousel_limit', v),             min: () => getMin('article.carousel_limit'), max: () => getMax('article.carousel_limit') },
        { key: 'article.save_edit',                  type: 'switch', label: '文章编辑保存',     desc: '控制文章编辑时的保存方式',                icon: "Edit",         get: () => config.getValue('article.save_edit'),            set: (v) => config.updateConfig('article.save_edit', v) },
        // ===== 顶层配置 =====
        { key: 'icon_enabled',                       type: 'switch', label: '图标搜索增强',   sys: true,     desc: '增强图标选择器的搜索功能',                icon: "Search",         get: () => config.getValue('icon_enabled'),                set: (v) => config.updateConfig('icon_enabled', v) },
        { key: 'button_permission_mode',             type: 'radio',  label: '按钮权限显示方式', desc: '控制无权限按钮的显示方式',                icon: "Lock",         get: () => config.getValue('button_permission_mode'),      set: (v) => config.updateConfig('button_permission_mode', v),        options: [{ value: 'hide', label: '隐藏' }, { value: 'disable', label: '禁用' }] },
        { key: 'collapse_search_enabled',            type: 'switch', label: '折叠搜索面板',   desc: '配置管理折叠面板默认展开/折叠状态',        icon: "Fold",         get: () => config.getValue('collapse_search_enabled'),     set: (v) => config.updateConfig('collapse_search_enabled', v) },
        { key: 'config_view_mode',                   type: 'radio',  label: '配置界面样式',     desc: '切换配置列表的展示布局',                  icon: Grid,           get: () => config.getValue('config_view_mode'),            set: (v) => config.updateConfig('config_view_mode', v),                                options: [{ value: 'sidebar', label: '分栏面板' }, { value: 'card', label: '折叠面板' }, { value: 'table', label: '折叠行内列表' }] },
        { key: 'tag_view_mode',                      type: 'radio',  label: '标签管理样式',     desc: '切换标签管理页面的展示布局',              icon: Grid,           get: () => config.getValue('tag_view_mode'),               set: (v) => config.updateConfig('tag_view_mode', v),                                   options: [{ value: 'table', label: '表格' }, { value: 'card', label: '卡片网格' }, { value: 'cloud', label: '标签云' }] },
        { key: 'search_menu_focus',                  type: 'switch', label: '搜索菜单聚焦',     desc: '选择菜单后保持搜索框焦点与下拉可见',      icon: "Search",       get: () => config.getValue('search_menu_focus'),            set: (v) => config.updateConfig('search_menu_focus', v) },
        { key: 'theme_layout_mode',                  type: 'radio',  label: '主题色布局',       desc: '切换主题色选择器的布局方式',              icon: Grid,           get: () => config.getValue('theme_layout_mode'),            set: (v) => config.updateConfig('theme_layout_mode', v),                              options: [{ value: 'float', label: '底部浮动' }, { value: 'inline', label: '行内色点' }, { value: 'popover', label: '全部 Popover' }] },
        { key: 'theme_dot_shape',                    type: 'radio',  label: '色块形状',         desc: '切换主题色块的显示形状',                  icon: "SwitchButton", get: () => config.getValue('theme_dot_shape'),              set: (v) => config.updateConfig('theme_dot_shape', v),                                 options: [{ value: 'circle', label: '圆形' }, { value: 'rect', label: '矩形' }, { value: 'square', label: '方形' }] },
        // ===== notification =====
        { key: 'notification.comment_enabled',       type: 'switch', label: '评论通知',         desc: '后台收到新评论时弹出通知提醒',            icon: Bell,           get: () => config.getValue('notification.comment_enabled'), set: (v) => config.updateConfig('notification.comment_enabled', v) },
        // ===== tree =====
        { key: 'tree.auth.line_style',               type: 'radio',  label: '授权树连接线',     desc: '控制授权页面树形控件的连接线样式',        icon: Grid,           get: () => config.getValue('tree.auth.line_style'),          set: (v) => config.updateConfig('tree.auth.line_style', v),                            options: [{ value: 'none', label: '无' }, { value: 'solid', label: '实线' }, { value: 'dashed', label: '虚线' }] },
        { key: 'tree.auth.child_mode',               type: 'radio',  label: '授权子节点宽度',   desc: '控制授权树形子节点的宽度模式',            icon: Grid,           get: () => config.getValue('tree.auth.child_mode'),          set: (v) => config.updateConfig('tree.auth.child_mode', v),                           options: [{ value: 'content', label: '内容宽' }, { value: 'fill', label: '占满' }] },
        { key: 'tree.cate.line_style',               type: 'radio',  label: '分类树连接线',     desc: '控制分类页面树形控件的连接线样式',        icon: Grid,           get: () => config.getValue('tree.cate.line_style'),          set: (v) => config.updateConfig('tree.cate.line_style', v),                            options: [{ value: 'none', label: '无' }, { value: 'solid', label: '实线' }, { value: 'dashed', label: '虚线' }] },
        { key: 'tree.cate.parent_mode',              type: 'radio',  label: '分类父节点宽度',   desc: '控制分类树形父节点的宽度模式',            icon: Grid,           get: () => config.getValue('tree.cate.parent_mode'),         set: (v) => config.updateConfig('tree.cate.parent_mode', v),                          options: [{ value: 'content', label: '内容宽' }, { value: 'custom', label: '较大值' }] },
        { key: 'tree.cate.parent_width',             type: 'number', label: '父节点自定义px',   desc: '自定义分类父节点的 px 值(仅较大值模式)',  icon: Grid,           get: () => config.getValue('tree.cate.parent_width'),        set: (v) => config.updateConfig('tree.cate.parent_width', v),                        min: () => getMin('tree.cate.parent_width'), max: () => getMax('tree.cate.parent_width') },
        { key: 'tree.cate.child_mode',               type: 'radio',  label: '分类子节点宽度',   desc: '控制分类树形子节点的宽度模式',            icon: Grid,           get: () => config.getValue('tree.cate.child_mode'),          set: (v) => config.updateConfig('tree.cate.child_mode', v),                           options: [{ value: 'content', label: '内容宽' }, { value: 'fill', label: '占满' }] },
        // ===== storage =====
        { key: 'storage.data_retention_days',        type: 'number', label: '数据保留天数',     desc: '业务表逻辑删除数据的保留天数',           icon: DeleteFilled,   get: () => config.getValue('storage.data_retention_days'),     set: (v) => config.updateConfig('storage.data_retention_days', v),         min: () => getMin('storage.data_retention_days'), max: () => getMax('storage.data_retention_days') },
        { key: 'storage.file_retention_days',        type: 'number', label: '文件保留天数',     desc: '文件删除后的保留天数',                   icon: FolderDelete,   get: () => config.getValue('storage.file_retention_days'),     set: (v) => config.updateConfig('storage.file_retention_days', v),         min: () => getMin('storage.file_retention_days'), max: () => getMax('storage.file_retention_days') },
        { key: 'storage.log_retention_days',         type: 'number', label: '日志保留天数',     desc: '日志删除后的保留天数',                            icon: DeleteFilled,   get: () => config.getValue('storage.log_retention_days'),      set: (v) => config.updateConfig('storage.log_retention_days', v),         min: () => 0, max: () => 365 },
        // ===== logo =====
        { key: 'logo.admin_dark_logo',               type: 'radio',  label: '管理员深色 Logo', desc: '管理员深色模式下 Logo 的动画样式',              icon: "Refresh",      get: () => config.getValue('logo.admin_dark_logo'),         set: (v) => config.updateConfig('logo.admin_dark_logo', v),                             options: [{ value: 'none', label: '无动画' }, { value: 'neon', label: '霓虹灯管' }, { value: 'multi-neon', label: 'SVG 多重描边霓虹' }, { value: 'energy-pulse', label: '能量脉冲' }, { value: 'stroke-scan', label: '镂空扫描描边' }, { value: 'glitch', label: '故障扫描线' }] },
        { key: 'logo.hide_image',                    type: 'switch', label: '隐藏 Logo 图片',   desc: '隐藏侧边栏 Logo 的头像图片',              icon: "Close",        get: () => config.getValue('logo.hide_image'),              set: (v) => config.updateConfig('logo.hide_image', v) },
        { key: 'logo.user_light_logo',           type: 'radio',  label: '用户浅色 Logo', desc: '用户浅色模式下 Logo 的动画样式',        icon: "Refresh",get: () => config.getValue('logo.user_light_logo'), set: (v) => config.updateConfig('logo.user_light_logo', v),  options: [{ value: 'none', label: '无动画' }, { value: 'neon', label: '霓虹灯管' }, { value: 'multi-neon', label: 'SVG 多重描边霓虹' }, { value: 'energy-pulse', label: '能量脉冲' }, { value: 'stroke-scan', label: '镂空扫描描边' }, { value: 'glitch', label: '故障扫描线' }] },
        { key: 'logo.admin_light_logo',          type: 'radio',  label: '管理员浅色 Logo', desc: '管理员浅色模式下 Logo 的动画样式',       icon: "Refresh",get: () => config.getValue('logo.admin_light_logo'),set: (v) => config.updateConfig('logo.admin_light_logo', v), options: [{ value: 'none', label: '无动画' }, { value: 'neon', label: '霓虹灯管' }, { value: 'multi-neon', label: 'SVG 多重描边霓虹' }, { value: 'energy-pulse', label: '能量脉冲' }, { value: 'stroke-scan', label: '镂空扫描描边' }, { value: 'glitch', label: '故障扫描线' }] },
        // ===== dashboard =====
        { key: 'dashboard.top_card_enabled',    type: 'switch', label: '顶部统计卡片',   desc: '仪表盘顶部问候语和统计数字卡片',            icon: DataBoard,    get: () => config.getValue('dashboard.top_card_enabled'),  set: (v) => config.updateConfig('dashboard.top_card_enabled', v) },
        // ===== dashboard.line_chart =====
        { key: 'dashboard.line_chart.y_valid_field', type:'radio', label: '有效 Y 字段', desc: '近 7 天趋势允许的有效 Y 字段',            icon: SemiSelect,       get: () => config.getValue('dashboard.line_chart.y_valid_field'), set: (v) => config.updateConfig('dashboard.line_chart.y_valid_field', v), options: [{ value: 'any', label: '任意' }, { value: 'all', label: '全部' }] },
        { key: 'dashboard.line_chart.priority',      type:'radio', label: '趋势优先级',   desc: '近 7 天趋势优先级',                      icon: Sort,         get: () => config.getValue('dashboard.line_chart.priority'),      set: (v) => config.updateConfig('dashboard.line_chart.priority', v),        options: [{ value: 'date', label: '日期' }, { value: 'data', label: '数据' }] },
        { key: 'dashboard.line_chart.week_offset',   type:'number',label: '周偏移',       desc: '近 7 天趋势图可回滚的周偏移',             icon: "Refresh",      get: () => config.getValue('dashboard.line_chart.week_offset'),   set: (v) => config.updateConfig('dashboard.line_chart.week_offset', v),     min: () => 0, max: () => 52 },
      ]
    },
    {
      key: 'user_config', label: '用户配置', icon: useRenderIcon('ri:user-settings-line'),
      items: [
        { key: 'collapse_enabled',       type: 'switch', label: '菜单折叠', desc: '侧边栏菜单默认折叠状态', icon: "Fold", get: () => config.getValue('collapse_enabled'), set: (v) => config.updateConfig('collapse_enabled', v) },
        { key: 'dark_enabled',           type: 'switch', label: '深色主题', desc: '切换暗色/亮色显示模式',   icon: "Moon", get: () => config.getValue('dark_enabled'),     set: (v) => config.updateConfig('dark_enabled', v) },
        { key: 'theme',                  type: 'radio',  label: '主题名称', desc: '切换全局主题色方案',         icon: "Sunny",get: () => config.getValue('theme'),       set: (v) => config.updateConfig('theme', v),                              options: [ { value: 'default', label: '默认蓝' },{ value: 'orange', label: '活力橙' },{ value: 'pink', label: '柔粉' },{ value: 'green', label: '翠绿' },{ value: 'purple', label: '紫韵' },{ value: 'enterprise', label: '企业蓝' },{ value: 'coral', label: '柔红' },{ value: 'warm', label: '柠绿' },{ value: 'aqua', label: '海碧' },{ value: 'indigo', label: '鸢尾紫' } ] },
      ]
    },
  ]

  // 注入元数据到 configStore，使其不再需要维护 CONFIG_DEFINITIONS / MESSAGE_MAP
  for (const g of groups) {
    registerItems(g.items, g.key)
  }

  return { groups, getMin, getMax }
}
