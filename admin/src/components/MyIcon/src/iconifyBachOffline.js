import { addCollection } from '@iconify/vue/dist/offline'
import { getIconData } from '@/utils/iconifyOffline'
import { useIconStore } from '@/store/icon'

// 最近一次批量注册的完成 Promise
let readyPromise = Promise.resolve()

/**
 * 批量注册的完成 Promise
 * 注册是异步的，只渲染「已注册图标」的 OfflineIcon 需等它 resolve 后再重渲染
 * @returns {Promise<void>}
 */
export function whenBatchIconsReady() {
    return readyPromise
}

/**
 * 批量注册离线图标（异步：图标集按前缀懒加载，加载完成后整集 addCollection）
 * @param {string[]} icons - 完整图标名列表，如 ['ep:check', 'ri:add-fill']
 * @returns {Promise<void>}
 */
export function addBatchIconList(icons) {
    // t_store_icon：iconifyBachOffline.js(所有批量图标)
    // 存入store（与图标数据加载无关，保持同步，供 IconCollect 使用）
    const iconStore = useIconStore()
    iconStore.setBatchIcons([...icons])

    readyPromise = registerIcons(icons)
    return readyPromise
}

/**
 * 按前缀分组加载并整集注册
 * @param {string[]} icons - 完整图标名列表
 * @returns {Promise<void>}
 */
async function registerIcons(icons) {
    const groups = {}
    for (const fullName of icons) {
        const [prefix, name] = fullName.split(':')
        const iconData = await getIconData(prefix, name)
        if (!iconData) continue
        if (!groups[prefix]) groups[prefix] = { prefix, icons: {} }
        groups[prefix].icons[name] = iconData
    }

    Object.values(groups).forEach((group) => addCollection(group))
}
