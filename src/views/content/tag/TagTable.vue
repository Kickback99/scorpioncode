<template>
  <!-- ===== 表格：搜索栏 + 数据表格 + 分页 ===== -->
  <div class="tt-page">
    <div class="tt-toolbar">
      <el-form label-width="auto" inline>
        <el-form-item>
          <el-input size="small" v-model="searchData.keyword" placeholder="请输入标签名/备注" />
        </el-form-item>
        <el-form-item>
          <el-button size="small" type="primary" icon="Search" plain @click="onSearch">搜索</el-button>
          <el-button size="small" type="info" icon="Refresh" plain @click="onReset">重置</el-button>
          <el-button size="small" type="primary" v-perm="'btn.tag.add'" icon="Plus" @click="handleAdd({})" plain>新增</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" :style="{ width: '100%' }" align="center">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="name" label="标签名" width="200" />
      <el-table-column prop="articleCount" label="文章数量" width="80" align="center" />
      <el-table-column prop="remark" label="备注" width="200" />
      <el-table-column v-if="showPermColumn(['btn.tag.update', 'btn.tag.remove'])" label="操作" width="150">
        <template #default="{row}">
          <el-button size="small" type="warning" v-perm="'btn.tag.update'" @click="handleEdit(row)" icon="Edit" circle plain />
          <el-popconfirm :title="`你确定要删除${row.name}吗`" @confirm="removeRole(row.id)" width="250px" icon="WarnTriangleFilled">
            <template #reference>
              <el-button size="small" type="danger" v-perm="'btn.tag.remove'" icon="Delete" circle plain />
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="tt-pagination">
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
// 表格布局 — 传统 CRUD 表格 + 居中搜索栏
// ============================================================
import { useTagList } from './useTagList'
import { showPermColumn } from '@/utils/permissions'

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
// 表格
// ============================================================
.tt-page {
  padding-top: 16px;
}

.tt-toolbar {
  @include flex(center, center, null)
}

.tt-pagination {
  @include flex(center, center, null);
  margin-top: 16px;
}
</style>
