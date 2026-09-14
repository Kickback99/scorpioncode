<template>
  <!-- ===== 卡片网格：搜索栏 + 卡片网格 + 滚动加载 ===== -->
  <div class="tc-page">
    <div class="tc-toolbar">
      <el-input size="small" v-model="searchData.keyword" placeholder="请输入标签名/备注" clearable class="tc-search" @keyup.enter="onSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button size="small" type="primary" @click="onSearch" plain>搜索</el-button>
      <el-button size="small" type="info" @click="onReset" plain>重置</el-button>
      <el-button size="small" type="primary" v-perm="'btn.tag.add'" icon="Plus" @click="handleAdd({})" plain>新增标签</el-button>
    </div>

    <div class="tc-grid">
      <div v-for="tag in tableData" :key="tag.id" class="tc-card">
        <div class="tc-card-head">
          <span class="tc-card-name">{{ tag.name }}</span>
          <el-badge :value="tag.articleCount" type="primary" />
        </div>
        <p class="tc-card-remark">{{ tag.remark || '暂无备注' }}</p>
        <div class="tc-card-footer">
          <span class="tc-card-time">{{ tag.createTime }}</span>
          <div class="tc-card-actions">
            <el-button size="small" type="warning" v-perm="'btn.tag.update'" @click="handleEdit(tag)" icon="Edit" circle plain />
            <el-popconfirm :title="`确定删除「${tag.name}」吗？`" @confirm="removeRole(tag.id)" width="220" icon="WarnTriangleFilled">
              <template #reference>
                <el-button size="small" type="danger" v-perm="'btn.tag.remove'" icon="Delete" circle plain />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
      <div v-if="!tableData.length" class="tc-empty">暂无标签数据</div>
    </div>

    <div ref="loadMoreRef" v-if="hasMore" class="tc-load-more">
      {{ loading ? '加载中...' : '下滑加载更多' }}
    </div>
    <div v-else-if="tableData.length" class="tc-load-more">没有更多了</div>
  </div>
</template>

<script setup>
// ============================================================
// 卡片网格 — 标签以卡片形式排列，hover 浮起，滚动分页
// ============================================================
import { Search } from '@element-plus/icons-vue'
import { useTagScroll } from './useTagScroll'
import { useTagEditor } from './useTagEditor'

const {
  searchData, tableData,
  loading, hasMore, loadMoreRef,
  onSearch, onReset,
} = useTagScroll()

const { handleAdd, handleEdit, removeRole } = useTagEditor()
</script>

<style lang="scss" scoped>
// ============================================================
// 卡片网格
// ============================================================
.tc-toolbar {
  position: sticky;
  top: 0;
  z-index: 10; // 低于 tags-view 的 11，避免盖住标签栏
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  // 上留白由 .tags-view 的 margin-bottom（20px）提供，此处只补下留白，保证上下间距一致
  padding: 0 0 20px;
  flex-wrap: wrap;
  background: var(--el-fill-color-light);
}
// 背景跟随主题（深浅 / pageTheme 自适应），与 .main-container 保持一致
html.dark .main-container:not(.page-theme) .tc-toolbar {
  background: var(--el-color-black);
}
.main-container.page-theme .tc-toolbar {
  background: var(--page-theme-bg);
}

.tc-search {
  width: 280px;
}

.tc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tc-card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all .2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, .08);
    border-color: var(--el-color-primary-light-5);
  }
}

.tc-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tc-card-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tc-card-remark {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  flex: 1;
}

.tc-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tc-card-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.tc-card-actions {
  display: flex;
  gap: 8px;
}

.tc-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.tc-load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-bottom: 24px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>
