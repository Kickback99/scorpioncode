<!-- CountTo — 数字滚动动画，从当前显示值缓动到 endVal，显示时做万/亿缩写 -->
<template>
  <span :title="fullText">{{ displayText }}</span>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { formatCount } from '@/utils/number'

// ============================================================
// 数据
// ============================================================
const props = defineProps({
  endVal: { type: Number, default: 0 },
  startVal: { type: Number, default: 0 },
  duration: { type: Number, default: 400 }
})

// ============================================================
// 方法
// ============================================================
// easeOutCubic 缓动：数值分布比 easeOutExpo 均匀，前 1/4 时长走约 58%
const easeOutCubic = (t, b, c, d) => c * (1 - Math.pow(1 - t / d, 3)) + b

const displayText = ref(formatCount(props.startVal))
// 悬浮展示确切值，缩略后仍能看全量
const fullText = computed(() => Math.round(props.endVal ?? 0).toLocaleString('en-US'))
// 记录当前滚到哪，作为下次滚动的起点 —— 增量更新才不会每次都从 startVal 重来
let current = props.startVal
let rafId = null

const run = () => {
  cancelAnimationFrame(rafId)
  const from = current
  const to = props.endVal
  if (from === to) return
  let startTime = null
  const step = (now) => {
    if (startTime === null) startTime = now
    const progress = Math.min(now - startTime, props.duration)
    current = progress < props.duration ? easeOutCubic(progress, from, to - from, props.duration) : to
    const text = formatCount(current)
    if (text !== displayText.value) displayText.value = text // 文本没变就不写，省掉重复渲染
    if (progress < props.duration) {
      rafId = requestAnimationFrame(step)
    }
  }
  rafId = requestAnimationFrame(step)
}

// ============================================================
// 生命周期
// ============================================================
onMounted(run)
watch(() => props.endVal, run)
onUnmounted(() => cancelAnimationFrame(rafId))
</script>
