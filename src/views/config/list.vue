<template>
  <div class="config-page">
    <div class="icon-switcher">
      <el-radio-group
        v-model="isSearch"
        size="small"
        @change="toggleComponent"
      >
        <el-radio-button :label="true">
          <el-icon class="mr-1"><Search /></el-icon>
          配置列表
        </el-radio-button>
        <el-radio-button :label="false">
          <el-icon class="mr-1"><Collection /></el-icon>
          配置管理
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="config-body">
      <component :is="isSearch ? ConfigList : ConfigManager" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, Collection } from '@element-plus/icons-vue'
import ConfigManager from './ConfigManager.vue'
import ConfigList from './ConfigList.vue'

const isSearch = ref(true)
const toggleComponent = () => {
  // 无需手动切换，v-model 已绑定
}

</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  /* padding: 0 20px; */
  overflow: hidden;
}

.icon-switcher {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  /* padding: 10px 0; */
  margin-bottom: 20px;
}

.config-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 自定义选中样式 */
:deep(.el-radio-button__inner) {
  transition: all 0.3s;
}
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--el-color-primary);
  color: white;
  border-color: var(--el-color-primary);
}
</style>