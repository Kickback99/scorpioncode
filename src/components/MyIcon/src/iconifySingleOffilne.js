import { ensureOfflineIcon } from '@/utils/iconifyOffline'

// 单个图标动态加载（离线）
// 图标集改为按前缀懒加载，首次用到某前缀时才拉取该集全量 JSON；
// 加载与注册去重都收敛在 utils/iconifyOffline.js，本模块只保留原调用入口
export const addSingleIcon = (icon) => ensureOfflineIcon(icon)
