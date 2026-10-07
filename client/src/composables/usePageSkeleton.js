import { onScopeDispose, readonly, ref, watch } from 'vue'

// ============================================================
// 数据
// ============================================================
// 页面内容是否处于骨架屏：视图上报，页脚据此隐藏自身
const visible = ref(false)

// ============================================================
// 控制
// ============================================================
/**
 * 上报本视图的骨架屏状态；组件卸载自动复位，否则骨架屏没走完就跳走会把页脚永久藏住
 * @param {import('vue').Ref<boolean>} shown 骨架屏是否可见
 */
export function usePageSkeletonReporter(shown) {
  watch(shown, (v) => {
    visible.value = v
  }, { immediate: true })
  onScopeDispose(() => {
    visible.value = false
  })
}

// ============================================================
// 公开方法
// ============================================================
/**
 * 页面骨架屏可见性（只读）
 * @returns {import('vue').Readonly<import('vue').Ref<boolean>>}
 */
export function usePageSkeleton() {
  return readonly(visible)
}
