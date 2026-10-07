import { readonly, ref } from 'vue'

// ============================================================
// 数据
// ============================================================
const visible = ref(false)
let timer = null

// 200ms 内跑完的导航不显示，避免命中缓存时闪一下
const SHOW_DELAY = 200

// ============================================================
// 控制
// ============================================================
/**
 * 开始计时：超过 SHOW_DELAY 仍未结束才真正显示转圈
 */
export function startRouteLoading() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    visible.value = true
  }, SHOW_DELAY)
}

/**
 * 结束并复位。未显示时调用是 no-op，所以可以无条件调用
 */
export function stopRouteLoading() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  visible.value = false
}

// ============================================================
// 公开方法
// ============================================================
/**
 * 路由级 loading 可见性（只读，仅 start/stop 可改）
 * @returns {import('vue').Readonly<import('vue').Ref<boolean>>}
 */
export function useRouteLoading() {
  return readonly(visible)
}
