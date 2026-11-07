<template>
  <!-- ===== 折叠行内列表：折叠分组 + 斑马纹行 ===== -->
  <div class="cct-root">
    <!-- ===== 展开/折叠工具栏 ===== -->
    <div class="cct-toolbar">
      <el-button text size="small" @click="handleToggleExpand">
        <el-icon><component :is="isAllExpanded ? 'Fold' : 'Expand'" /></el-icon> {{ isAllExpanded ? '全部折叠' : '全部展开' }}
      </el-button>
    </div>

    <el-collapse v-model="activeNames">
      <el-collapse-item v-for="group in groups" :key="group.key" :name="group.key">
        <template #title>
          <div class="cct-collapse-title">
            <el-icon><component :is="group.icon" /></el-icon>
            <span>{{ group.label }}</span>
            <span class="cct-collapse-count">{{ group.items.length }} 项</span>
          </div>
        </template>
        <div
          v-for="(item, idx) in group.items"
          :key="item.key"
          class="cct-row"
          :class="{ 'cct-row-alt': idx % 2 === 1 }"
        >
          <div class="cct-row-left">
            <el-icon class="cct-row-icon"><component :is="item.icon" /></el-icon>
            <div class="cct-row-text">
              <span class="cct-row-label">{{ item.label }}</span>
              <span class="cct-row-desc">{{ item.desc }}</span>
            </div>
          </div>
          <div class="cct-row-right">
            <ConfigControl :item="item" />
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
// 折叠行内列表
// ============================================================
.cct-toolbar {
  position: sticky;
  top: 0; // 滚动容器已是 .config-body，radio-button 在其外部
  z-index: 5;
  background: var(--el-bg-color);
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.cct-root :deep(.el-collapse) {
  border: none;
  --el-collapse-header-height: 48px;
}

.cct-root :deep(.el-collapse-item) {
  margin-bottom: 4px;
  border: none;
  border-radius: 8px;
  background: var(--el-bg-color);
}

.cct-root :deep(.el-collapse-item__header) {
  position: sticky;
  top: 40px; // 工具栏（top:0，高度 ~40px）
  z-index: 4;
  padding: 0 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.cct-root :deep(.el-collapse-item__wrap) {
  border: 1px solid var(--el-border-color-lighter);
  border-top: none;
  border-radius: 0 0 8px 8px;
  background: var(--el-bg-color);
}

.cct-root :deep(.el-collapse-item__content) {
  padding: 0;
}

.cct-collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.cct-collapse-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
  margin-right: 8px;
}

.cct-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 16px;
  transition: background .1s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--el-fill-color-lighter);
  }

  &.cct-row-alt {
    background: var(--el-bg-color-overlay);

    &:hover {
      background: var(--el-fill-color-lighter);
    }
  }
}

.cct-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cct-row-icon {
  font-size: 18px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.cct-row-text {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.cct-row-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  white-space: nowrap;
}

.cct-row-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cct-row-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
</style>
