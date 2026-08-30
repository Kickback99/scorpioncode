<!-- components/ReplyInput.vue -->
<template>
  <div class="reply-input-wrapper" :class="{ 'child-reply-wrapper': isChildReply }">
    <div class="reply-input-container">

      <div class="reply-input-flex">
        <v-textarea
          v-model="internalContent"
          :placeholder="`回复 ${targetUsername || '匿名用户'}...`"
          rows="2"
          variant="outlined"
          density="compact"
          hide-details
          counter
          maxlength="500"
          autofocus
          @keydown.enter.ctrl="handleSubmit"
          class="reply-textarea"
        ></v-textarea>
        <div class="reply-actions">
          <v-btn
            size="x-small"
            variant="text"
            @click="handleCancel"
          >
            取消
          </v-btn>
          <v-btn
            size="x-small"
            color="primary"
            variant="flat"
            :loading="loading"
            :disabled="!internalContent.trim()"
            @click="handleSubmit"
          >
            回复
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  // 目标用户名
  targetUsername: {
    type: String,
    default: ''
  },
  // 是否为子评论回复
  isChildReply: {
    type: Boolean,
    default: false
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 外部控制的内容（可选）
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'cancel', 'update:content'])

// 内部内容状态
const internalContent = ref(props.content)

// 监听外部内容变化
watch(() => props.content, (newVal) => {
  internalContent.value = newVal
})

// 监听内部内容变化，同步到外部
watch(internalContent, (newVal) => {
  emit('update:content', newVal)
})

// 提交回复
const handleSubmit = () => {
  if (!internalContent.value.trim()) return
  emit('submit', internalContent.value)
}

// 取消回复
const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.reply-input-wrapper {
  margin: 8px 16px 8px 56px;
  animation: slideDown 0.2s ease-out;
}

.child-reply-wrapper {
  margin-left: 56px !important;
}

.reply-input-container {
  display: flex;
  gap: 12px;
  padding: 0 12px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  /* border-left: 3px solid rgb(var(--v-theme-primary)); */
}

.reply-avatar {
  flex-shrink: 0;
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.reply-input-flex {
  flex: 1;
}

.reply-textarea {
  font-size: 0.875rem;
}

.reply-textarea :deep(textarea) {
  font-size: 0.875rem;
  padding: 8px 12px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 600px) {
  .reply-input-wrapper {
    margin-left: 8px;
    margin-right: 8px;
  }
  
  .child-reply-wrapper {
    margin-left: 8px !important;
  }
}
</style>