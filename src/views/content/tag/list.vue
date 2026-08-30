<template>
  <!-- ===== 标签管理：按 tag_view_mode 渲染对应变体 ===== -->
  <div class="tag-list-root">
    <TagTable v-if="mode === 'table'" />
    <TagCard v-else-if="mode === 'card'" />
    <TagCloud v-else />

    <!-- 共享弹窗 -->
    <el-dialog v-model="dialogVisible" :title="title" width="380px" top="15vh">
      <el-form ref="ruleFormRef" :model="formModel" :rules="rules" label-width="90px" size="small">
        <el-form-item label="标签名称" prop="name">
          <el-input  placeholder="请输入标签名称" v-model="formModel.name" />
        </el-form-item>
        <el-form-item label="标签备注" prop="remark">
          <el-input  placeholder="请输入标签备注" v-model="formModel.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" type="primary" @click="confirm" plain>确认</el-button>
        <el-button size="small" type="info" @click="dialogVisible = false" plain>取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { computed } from 'vue'
import { useConfigStore } from '@/store/config'
import { useTagList } from './useTagList'
import TagTable from './TagTable.vue'
import TagCard from './TagCard.vue'
import TagCloud from './TagCloud.vue'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

/** 当前标签管理界面样式：table | card（默认）| cloud */
const mode = computed(() => configStore.getTagViewMode())

// 弹窗状态来自 useTagList（模块单例，与变体组件共享）
const { dialogVisible, title, ruleFormRef, formModel, rules, confirm } = useTagList()
</script>

<style scoped>
.tag-list-root {
  width: 100%;
}
</style>
