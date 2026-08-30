<template>
  <!-- ===== A: 页面底部 MoreFilled → hover 弹出主题色点 ===== -->
  <div class="tf-root">
    <el-popover
      placement="top"
      trigger="hover"
      :offset="4"
      :show-arrow="false"
      popper-class="tf-popover"
      :hide-after="700"
      @show="onShow"
    >
      <template #reference>
        <span class="tf-icon" @mouseleave="onIconLeave"><el-icon><MoreFilled /></el-icon></span>
      </template>
      <div ref="pickerRef" class="tf-picker">
        <ThemeDots />
      </div>
    </el-popover>
  </div>
</template>

<script setup>
// ============================================================
// 底部浮动 — 页面底部中间 MoreFilled 图标，hover 弹出色点
// 色点动画：Mac Dock 风格 — 进入时中间向左右展开+向上冲击，离开时聚拢+向下冲击
// 使用 Web Animations API 确保离开动画在 popover DOM 移除前可靠执行
// ============================================================
import { ref, nextTick } from 'vue'
import ThemeDots from './ThemeDots.vue'

const pickerRef = ref(null)

/** 当前动画方向：'in' | 'out' | null，用于 mouseenter 判断是否需要恢复 */
let animDir = null
/** 延迟触发离开动画的计时器 */
let leaveTimer = null

/** 执行色点动画：'in' 展开 / 'out' 聚拢 */
function animateDots(dir) {
  const dots = pickerRef.value?.querySelectorAll('.theme-dot')
  if (!dots || dots.length === 0) return
  animDir = dir

  dots.forEach((dot, i) => {
    // 取消该元素上仍在运行的动画（快速划入划出时避免堆积）
    dot.getAnimations().forEach(a => a.cancel())

    const dist = Math.abs(i - 4.5)            // 距中心距离
    const sx = (4.5 - i) * 30                 // X 偏移：左侧正→右移，右侧负→左移

    if (dir === 'in') {
      dot.animate([
        { transform: `translateX(${sx}px) scale(0) translateY(10px)`, opacity: 0 },
        { transform: 'translateX(0) scale(1.1) translateY(-3px)', opacity: 1, offset: 0.35 },
        { transform: 'translateX(0) scale(0.95) translateY(1px)', offset: 0.65 },
        { transform: 'translateX(0) scale(1) translateY(0)', opacity: 1 },
      ], {
        duration: 450,
        delay: dist * 30,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
      })
    } else {
      // 离开：入场动画的完全倒放 — 同时长、同缓动、同偏移，帧值反转
      dot.animate([
        { transform: 'translateX(0) scale(1) translateY(0)', opacity: 1 },
        { transform: 'translateX(0) scale(0.95) translateY(1px)', opacity: 1, offset: 0.35 },
        { transform: 'translateX(0) scale(1.1) translateY(-3px)', opacity: 1, offset: 0.65 },
        { transform: `translateX(${sx}px) scale(0) translateY(10px)`, opacity: 0 },
      ], {
        duration: 450,
        delay: (4.5 - dist) * 30,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
      })
    }
  })
}

function onShow() {
  clearTimeout(leaveTimer)
  nextTick(() => {
    animateDots('in')
    // popover DOM 每次打开重建，绑定浮层事件
    const popper = document.querySelector('.tf-popover')
    if (!popper) return
    popper.addEventListener('mouseleave', animateOut)
    // 短暂离开后重新进入：取消聚拢、恢复展开
    popper.addEventListener('mouseenter', () => {
      if (animDir === 'out') animateDots('in')
    })
  })
}

function animateOut() {
  animateDots('out')
}

/** 鼠标离开图标时：延迟检测 popover 是否被悬停（避开图标↔浮层间隙） */
function onIconLeave() {
  leaveTimer = setTimeout(() => {
    const popper = document.querySelector('.tf-popover')
    // 鼠标已在 popover 内 → 不触发离开
    if (popper && popper.matches(':hover')) return
    animateOut()
  }, 80)
}
</script>

<style scoped lang="scss">
.tf-root {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: auto;
  line-height: 0;
}

.tf-icon {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .2s;

  &:hover { color: var(--el-color-primary); }
}

.tf-picker {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: nowrap;
}
</style>

<style lang="scss">
.tf-popover {
  padding: 8px 12px !important;
  min-width: auto !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  .el-popover__arrow {
    display: none !important;
  }
}
</style>
