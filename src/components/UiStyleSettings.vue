<template>
  <div class="ui-style-settings">
    <el-radio-group
      :model-value="uiStore.uiMode"
      @change="onStyleChange"
      size="small"
    >
      <el-radio-button value="full">实心</el-radio-button>
      <el-radio-button value="plain">描边</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { useUiStore } from '@/store/ui'
import { applyTheme } from '@/assets/common/theme'
import { useUserConfigStore } from '@/store/userConfig'

// ============================================================
// Store
// ============================================================
const uiStore = useUiStore()
const userConfigStore = useUserConfigStore()

// ============================================================
// 方法
// ============================================================
function onStyleChange(style) {
  uiStore.setUiMode(style)
  applyTheme(userConfigStore.currentTheme, userConfigStore.isDarkEnabled)
}
</script>
