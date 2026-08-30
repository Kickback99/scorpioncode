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

    <div class="tcl-pagination">
      <el-pagination
        size="small"
        v-model:current-page="params.pageNum"
        v-model:page-size="params.pageSize"
        :page-sizes="[2, 5, 7, 10]"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
// ============================================================
// 标签云 — 圆形气泡展示，按文章数分档大小，hover 露出操作按钮
// ============================================================
import { Search } from '@element-plus/icons-vue'
import { useTagList } from './useTagList'

const {
  searchData, tableData, params, total,
  onSizeChange, onCurrentChange,
  onSearch, onReset,
  handleAdd, handleEdit,
  removeRole,
} = useTagList()
</script>

<style lang="scss" scoped>
// ============================================================
// 标签云
// ============================================================
.tcl-page {
  padding-top: 16px;
}

.tcl-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.tcl-search {
  width: 240px;
}

.tcl-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 32px 20px;
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
  width: 100%;
  text-align: center;
  padding: 60px 0;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.tcl-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
