// 懒加载 iconify 图标集（全量 JSON 体积大：ri 926KB / fa-solid 643KB / ep 130KB），
// 用到某前缀时才动态加载该集，每个集只加载一次。
// 注：@iconify/vue 在线版与 dist/offline 的存储相互独立，故本文档自带注册去重。
import { addIcon } from '@iconify/vue/dist/offline'

const loaders = {
  ep: () => import('@iconify-json/ep/icons.json'),
  ri: () => import('@iconify-json/ri/icons.json'),
  'fa-solid': () => import('@iconify-json/fa-solid/icons.json'),
}

const cache = {}

/**
 * 按前缀加载图标集，返回该集的 icons 表（不存在的前缀返回 null）
 * @param {string} prefix - 图标前缀，如 'ri' / 'ep' / 'fa-solid'
 * @returns {Promise<Object|null>}
 */
export function loadIconSet(prefix) {
  const loader = loaders[prefix]
  if (!loader) return Promise.resolve(null)
  if (!cache[prefix]) {
    cache[prefix] = loader().then((m) => m.icons)
  }
  return cache[prefix]
}

/**
 * 按前缀取单个图标的原始数据，并按各图标集的历史约定补齐宽高
 * @param {string} prefix - 图标前缀
 * @param {string} name - 图标名（不含前缀）
 * @returns {Promise<Object|null>} 图标数据，取不到返回 null
 */
export async function getIconData(prefix, name) {
  const icons = await loadIconSet(prefix)
  const data = icons?.[name]
  if (!data) return null
  // ep 与 ri 的原始数据不带尺寸，按图标集设计稿补齐；fa-solid 自带则沿用
  if (prefix === 'ep') return { ...data, width: 1024, height: 1024 }
  if (prefix === 'ri') return { ...data, width: 24, height: 24 }
  if (prefix === 'fa-solid') return data.width ? data : { ...data, width: 1024, height: 1024 }
  return null
}

// 已注册到离线存储的图标名，用于避免重复加载
const registered = new Set()

/**
 * 按需加载并注册单个离线图标
 * 调用方据返回值决定是否需要重渲染（离线 Icon 的 storage 是普通对象，addIcon 不触发响应式更新）
 * @param {string} icon - 完整图标名，如 'ri:airplay-fill'
 * @returns {Promise<boolean>} 本次是否真正注册了图标
 */
export async function ensureOfflineIcon(icon) {
  if (registered.has(icon)) return false
  const [prefix, name] = icon.split(':')
  const data = await getIconData(prefix, name)
  if (!data) return false
  addIcon(icon, data)
  registered.add(icon)
  return true
}
