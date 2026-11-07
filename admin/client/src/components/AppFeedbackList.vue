<template>
  <!-- ===== 数据表格 ===== -->
  <v-sheet class="pa-6">
    <v-data-table
      :headers="feedbackHeaders"
      :items="feedbackList"
      :loading="feedbackLoading"
      hover
    >
      <template v-slot:item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" size="small">
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template v-slot:no-data>
        <v-empty-state
          class="custom-empty-state"
          headline="暂无反馈"
          text="你还没有提交任何反馈"
          icon="mdi-message-text-outline"
        ></v-empty-state>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// ============================================================
// 数据
// ============================================================
const feedbackHeaders = [
  { title: '标题', key: 'title', align: 'start' },
  { title: '内容', key: 'content' },
  { title: '状态', key: 'status' },
  { title: '提交时间', key: 'createdAt' }
]
const feedbackList = ref([])
const feedbackLoading = ref(false)

// ============================================================
// 渲染
// ============================================================
const loadFeedback = async () => {
  feedbackLoading.value = true
  try {
    // TODO: 调用接口获取数据
    feedbackList.value = [
      { id: 1, title: '建议增加Python课程', content: '希望增加更多Python实战内容', status: '待处理', createdAt: '2024-01-15' }
    ]
  } finally {
    feedbackLoading.value = false
  }
}

// 本组件随「我的反馈」tab 激活才挂载（VWindowItem 默认非 eager），挂载即加载
onMounted(loadFeedback)

// ============================================================
// 工具方法
// ============================================================
const getStatusColor = (status) => {
  const colors = {
    '待处理': 'warning',
    '处理中': 'info',
    '已解决': 'success',
    '已关闭': 'grey'
  }
  return colors[status] || 'default'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}
</script>
