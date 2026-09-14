<template>
  <!-- ===== 标签云：搜索栏 + 气泡云 + 分页 ===== -->
  <div class="tcl-page">
    <div class="tcl-toolbar">
      <el-input size="small" v-model="searchData.keyword" placeholder="请输入标签名/备注" clearable class="tcl-search" @keyup.enter="onSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button size="small" type="primary" icon="Search" @click="onSearch" plain>搜索</el-button>
      <el-button size="small" type="info" icon="Refresh" @click="onReset" plain>重置</el-button>
      <el-button size="small" type="primary" v-perm="'btn.tag.add'" icon="Plus" @click="handleAdd({})" plain>新增</el-button>
    </div>

    <div class="tcl-cloud">
      <div
        v-for="tag in tableData"
        :key="tag.id"
        class="tcl-bubble"
      >
        <el-tooltip :content="tag.name" :show-after="300" placement="top">
          <span class="tcl-bubble-name">{{ tag.name }}</span>
        </el-tooltip>
        <span class="tcl-bubble-count">{{ tag.articleCount }}</span>
        <div class="tcl-bubble-actions">
          <el-button size="small" type="warning" v-perm="'btn.tag.update'" @click.stop="handleEdit(tag)" icon="Edit" circle plain />
          <el-popconfirm :title="`确定删除「${tag.name}」？`" @confirm="removeRole(tag.id)" width="220" icon="WarnTriangleFilled">
            <template #reference>
              <el-button size="small" type="danger" v-perm="'btn.tag.remove'" icon="Delete" @click.stop circle plain />
            </template>
          </el-popconfirm>
        </div>
      </div>
      <div v-if="!tableData.length" class="tcl-empty">暂无标签，点击「新增」创建一个吧</div>
    </div>

    <div ref="loadMoreRef" v-if="hasMore" class="tcl-load-more">
      {{ loading ? '加载中...' : '下滑加载更多' }}
    </div>
    <div v-else-if="tableData.length" class="tcl-load-more">没有更多了</div>
  </div>
</template>

<script setup>
// ============================================================
// 标签云 — 圆形气泡展示，按文章数分档大小，hover 露出操作按钮
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
// 标签云
// ============================================================
.tcl-toolbar {
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
html.dark .main-container:not(.page-theme) .tcl-toolbar {
  background: var(--el-color-black);
}
.main-container.page-theme .tcl-toolbar {
  background: var(--page-theme-bg);
}

.tcl-search {
  width: 240px;
}

.tcl-cloud {
  display: grid;
  grid-template-columns: repeat(auto-fit, 100px);
  gap: 20px;
  justify-content: center;
  // 顶部留白由上方的 .tcl-toolbar 提供，避免与工具栏 padding 叠加
  padding: 0 20px 32px;
  min-height: 200px;
}

.tcl-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 50%;
  cursor: default;
  transition: all .2s;
  position: relative;

  width: 100px;
  height: 100px;
  background: var(--el-color-primary-light-7);
  border: 1px solid var(--el-color-primary-light-5);

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, .12);

    .tcl-bubble-actions { opacity: 1; }
  }

  /* full — 实心底色+白字 */
  .ui-full & {
    background: var(--el-color-primary-solid-bg);
    border-color: var(--el-color-primary-solid-bg);
    .tcl-bubble-name { color: var(--el-color-primary-text); }
    .tcl-bubble-count {
      color: var(--el-color-primary-solid-bg);
      background: var(--el-color-primary-text);
    }
    &:hover {
      background: var(--el-color-primary-light-3);
      border-color: var(--el-color-primary-light-3);
    }
  }

  /* plain — 浅底色+主色描边 */
  .ui-plain & {
    background: var(--el-color-primary-plain-bg);
    border-color: var(--el-color-primary-plain);
    .tcl-bubble-name { color: var(--el-color-primary); }
    .tcl-bubble-count {
      color: var(--el-color-primary-text);
      background: var(--el-color-primary);
    }
    &:hover {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
      .tcl-bubble-name { color: var(--el-color-primary-text); }
      .tcl-bubble-count {
        color: var(--el-color-primary);
        background: var(--el-color-primary-text);
      }
    }
  }
}

.tcl-bubble-name {
  font-size: 14px;
  // font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tcl-bubble-count {
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  padding: 2px 8px;
  border-radius: 10px;
}

.tcl-bubble-actions {
  position: absolute;
  bottom: -8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity .15s;
}

.tcl-empty {
  grid-column: 1 / -1;
  width: 100%;
  text-align: center;
  padding: 60px 0;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.tcl-load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-bottom: 24px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>
