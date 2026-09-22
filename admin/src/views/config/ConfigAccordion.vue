<template>
  <!-- ===== 折叠面板（卡片式）：折叠分组 + 卡片网格 ===== -->
  <div class="ca-root">
    <!-- ===== 展开/折叠工具栏 ===== -->
    <div class="ca-toolbar">
      <el-button text size="small" @click="handleToggleExpand">
        <el-icon><component :is="isAllExpanded ? 'Fold' : 'Expand'" /></el-icon> {{ isAllExpanded ? '全部折叠' : '全部展开' }}
      </el-button>
    </div>

    <el-collapse v-model="activeNames">
      <el-collapse-item v-for="group in groups" :key="group.key" :name="group.key">
        <template #title>
          <div class="ca-collapse-title">
            <el-icon><component :is="group.icon" /></el-icon>
            <span>{{ group.label }}</span>
            <span class="ca-collapse-count">{{ group.items.length }} 项</span>
          </div>
        </template>
        <div class="ca-grid">
          <div
            v-for="item in group.items"
            :key="item.key"
            class="ca-item"
            :class="{ 'ca-item--radio': item.type === 'radio' }"
          >
            <div class="ca-item-top">
              <el-icon class="ca-item-icon"><component :is="item.icon" /></el-icon>
              <div class="ca-item-info">
                <span class="ca-item-label">{{ item.label }}</span>
                <span class="ca-item-desc">{{ item.desc }}</span>
              </div>
            </div>
            <div class="ca-item-ctrl">
              <ConfigControl :item="item" />
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed, ref } from 'vue'
import { useConfigItems } from './configItems'
import ConfigControl from './ConfigControl.vue'

// ============================================================
// 数据
// ============================================================
const { groups } = useConfigItems()

// 默认全部折叠
const allKeys = groups.map(g => g.key)
const activeNames = ref([])

// ============================================================
// 展开/折叠
// ============================================================

/** 是否全部展开 */
const isAllExpanded = computed(() => activeNames.value.length === allKeys.length)

/** 展开/折叠切换 */
const handleToggleExpand = () => {
  if (isAllExpanded.value) {
    activeNames.value = []
  } else {
    activeNames.value = [...allKeys]
  }
}
</script>

<style lang="scss" scoped>
// ============================================================
// 折叠面板（卡片式）
// ============================================================
.ca-toolbar {
  position: sticky;
  top: 0; // 滚动容器已是 .config-body，radio-button 在其外部
  z-index: 5;
  background: var(--el-bg-color);
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.ca-root :deep(.el-collapse) {
  border: none;
  --el-collapse-header-height: 52px;
}

.ca-root :deep(.el-collapse-item) {
  margin-bottom: 8px;
  border: none;
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
}

.ca-root :deep(.el-collapse-item__header) {
  position: sticky;
  top: 40px; // 工具栏（top:0，高度 ~40px）
  z-index: 4;
  padding: 0 20px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ca-root :deep(.el-collapse-item__wrap) {
  border: 1px solid var(--el-border-color-lighter);
  border-top: none;
  border-radius: 0 0 10px 10px;
  background: var(--el-bg-color);
}

.ca-collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.ca-collapse-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
  margin-right: 8px;
}

.ca-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 16px 20px 20px;
}

.ca-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  gap: 12px;
  transition: all .15s;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
  }
}

.ca-item-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.ca-item-icon {
  font-size: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.ca-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ca-item-label {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.ca-item-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.ca-item-ctrl {
  flex-shrink: 0;
}

// radio 型配置项：控件独占一行，避免挤占横向空间
.ca-item--radio {
  flex-direction: column;
  align-items: flex-start;

  .ca-item-ctrl {
    width: 100%;
    padding-top: 4px;
  }
}
</style>
