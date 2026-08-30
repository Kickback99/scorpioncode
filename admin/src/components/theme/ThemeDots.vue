<template>
  <!-- ===== 主题色点：默认 flex 换行，传 columns 则用 grid ===== -->
  <div :class="columns ? 'theme-dots-grid' : 'theme-dots-flex'" :style="columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}">
    <span
      v-for="t in themeList"
      :key="t.name"
      class="theme-dot"
      :class="[dotClass, { active: userConfigStore.currentTheme === t.name }]"
      :style="{ backgroundColor: themePresets[t.name].colors.primary.bg }"
      :title="t.label"
      @click="handleThemeChange(t.name)"
    ></span>
  </div>
</template>

<script setup>
// ============================================================
// 主题色点 — 纯展示组件，shape prop 控制圆形/矩形/方形
// ============================================================
import { computed } from 'vue'
import { useUserConfigStore } from '@/store/userConfig'
import { useConfigStore } from '@/store/config'
import { themePresets, themeList } from '@/assets/common/theme/presets'

defineProps({
  columns: { type: Number, default: 0 }
})

const userConfigStore = useUserConfigStore()
const configStore = useConfigStore()

const dotClass = computed(() => {
  const shape = configStore.getThemeDotShape()
  return { circle: 'dot--circle', rect: 'dot--rect', square: 'dot--square' }[shape] || 'dot--circle'
})

function handleThemeChange(name) {
  userConfigStore.setTheme(name)
}
</script>

<style scoped lang="scss">
.theme-dots-flex {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.theme-dots-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  justify-items: center;
}

.theme-dot {
  display: inline-block;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all .15s;

  &:hover { transform: scale(1.15); }

  &.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
  }

  // 圆形
  &.dot--circle {
    width: 22px; height: 22px;
    border-radius: 50%;
  }

  // 矩形（圆角矩形）
  &.dot--rect {
    width: 32px; height: 22px;
    border-radius: 5px;
  }

  // 方形（小圆角）
  &.dot--square {
    width: 22px; height: 22px;
    border-radius: 3px;
  }
}
</style>
