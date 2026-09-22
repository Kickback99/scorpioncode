<template>
  <!-- ===== 标签管理：按 tag_view_mode 渲染对应变体 ===== -->
  <div class="tag-list-root" :class="{ 'is-table-view': mode === 'table' }">
    <TagTable v-if="mode === 'table'" />
    <TagCard v-else-if="mode === 'card'" />
    <TagCloud v-else />

    <!-- 共享弹窗 -->
    <el-dialog v-model="dialogVisible" :title="title" width="380px" top="15vh">
      <el-form ref="ruleFormRef" :model="formModel" :rules="rules" label-width="auto" size="small">
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
import { useTagEditor } from './useTagEditor'
import TagTable from './TagTable.vue'
import TagCard from './TagCard.vue'
import TagCloud from './TagCloud.vue'

// ============================================================
// 数据
// ============================================================
const configStore = useConfigStore()

/** 当前标签管理界面样式：table | card（默认）| cloud */
const mode = computed(() => configStore.getTagViewMode())

// 弹窗状态来自 useTagEditor（模块单例，与变体组件共享）
const { dialogVisible, title, ruleFormRef, formModel, rules, confirm } = useTagEditor()
</script>

<style scoped>
.tag-list-root {
  width: 100%;
}

/* 表格视图下弹窗默认以视口为中心，而内容区被侧边栏推右，两者相差半个侧边栏宽；
   右移该距离，弹窗中心才与表格中心对齐。变量由 Layout 提供，移动端为 0px */
/* 本规则给 .el-dialog 加了 transform，日后给此弹窗加 fullscreen 需排除 .is-fullscreen */
.is-table-view :deep(.el-dialog) {
  transform: translateX(calc(var(--sidebar-width, 0px) / 2));
}
</style>
