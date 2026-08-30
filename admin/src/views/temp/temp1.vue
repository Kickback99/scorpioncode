<template>
  <div class="demo-container">
    <h2>el-image 内置预览功能演示</h2>

    <!-- 图片网格 -->
    <div class="image-grid">
      <div
        v-for="(img, index) in imageList"
        :key="img.id"
        class="image-card"
      >
        <el-image
          :src="img.thumb"
          :fit="'cover'"
          class="image-preview"
          loading="lazy"
          :preview-src-list="previewSrcList"
          :initial-index="index"
          preview-teleported
        >
          <template #error>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>

        <div class="image-footer">
          <span class="image-title">{{ img.title }}</span>
          <span class="image-index">第 {{ index + 1 }} 张</span>
        </div>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="tips">
      <h4>预览器快捷操作</h4>
      <div class="tips-grid">
        <div class="tip-item">
          <kbd>←</kbd><kbd>→</kbd>
          <span>左右切换</span>
        </div>
        <div class="tip-item">
          <kbd>ESC</kbd>
          <span>关闭预览</span>
        </div>
        <div class="tip-item">
          <kbd>滚轮</kbd>
          <span>缩放图片</span>
        </div>
        <div class="tip-item">
          <kbd>Space</kbd>
          <span>切换遮罩模式</span>
        </div>
        <div class="tip-item">
          工具栏
          <span>旋转 / 下载 / 放大缩小按钮</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'

const imageList = ref([
  { id: 1, thumb: 'https://picsum.photos/seed/a/400/300', title: '山水风景' },
  { id: 2, thumb: 'https://picsum.photos/seed/b/400/300', title: '城市夜景' },
  { id: 3, thumb: 'https://picsum.photos/seed/c/400/300', title: '海滩日落' },
  { id: 4, thumb: 'https://picsum.photos/seed/d/400/300', title: '森林小径' },
  { id: 5, thumb: 'https://picsum.photos/seed/e/400/300', title: '雪山日出' },
  { id: 6, thumb: 'https://picsum.photos/seed/f/400/300', title: '沙漠驼影' },
  { id: 7, thumb: 'https://picsum.photos/seed/g/400/300', title: '湖泊倒影' },
  { id: 8, thumb: 'https://picsum.photos/seed/h/400/300', title: '草原骏马' },
])

// 预览大图列表（点击任意一张后可以在预览器中翻页看全部）
const previewSrcList = computed(() => imageList.value.map(i => i.thumb))
</script>

<style scoped lang="scss">
.demo-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;

  h2 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// ===== 图片网格 =====
.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.image-card {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
  }
}

.image-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: block;
  cursor: pointer; // 提示可点击
}

.image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 32px;
}

.image-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .image-title {
    color: var(--el-text-color-primary);
  }
}

// ===== 操作提示 =====
.tips {
  margin-top: 32px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  h4 {
    margin: 0 0 16px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.tips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);

  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 11px;
    font-family: inherit;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    color: var(--el-text-color-primary);
  }

  span {
    color: var(--el-text-color-secondary);
  }
}
</style>
