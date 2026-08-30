<!-- src/views/components/ImageReference.vue -->
<template>
  <div class="image-reference">
    <div class="image-reference-header">
      <!-- <span class="image-reference-title">{{ title }}</span> -->
      <el-button
        size="small"
        type="info"
        v-if="showClear"
        @click="handleClear"
        plain
      >
        清空
      </el-button>
    </div>

    <el-form label-width="auto">
      <!-- ===== 搜索栏 ===== -->
      <el-form-item >
        <SmartAutoComplete
          size="default"
          v-model="selectedArticle"
          :fetch-suggestions-api="fetchArticleForImage"
          :placeholder="searchPlaceholder"
          :max="1"
          :debounce-delay="300"
          :min-search-length="1"
          :auto-search-on-enter="true"
          :allow-custom="false"
          custom-disabled-message="请输入已存在的文章标题"
          :style="{ width: searchWidth, backgroundColor:userConfigStore.isDarkEnabled?'#000':'#fff' }"
          @dropdown-visible="handleDropdownVisible"
        />
      </el-form-item>

      <!-- 图片类型选择器 -->
      <el-form-item v-if="!loading && imageList.length > 0 && props.showImageTypeSwitch" label="图片类型">
        <el-radio-group v-model="currentImageType" @change="handleImageTypeChange" size="small">
          <el-radio-button value="all">全部图片</el-radio-button>
          <el-radio-button value="cover">仅封面</el-radio-button>
          <el-radio-button value="content">仅内容图</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 加载状态 -->
      <el-form-item v-if="loading" label=" ">
        <div class="image-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载图片中...</span>
        </div>
      </el-form-item>

      <!-- ===== 图片列表 ===== -->
      <el-form-item v-else-if="filteredImageList.length > 0" label=" ">
        <div
          class="image-container"
          :class="layout === 'horizontal' ? 'layout-horizontal' : 'layout-vertical'"
        >
          <div
            v-for="(img, index) in filteredImageList"
            :key="img.id || index"
            class="image-item"
            :class="{
              'image-selected': selectedIndex === index,
              'image-disabled': disabled
            }"
            @click="!disabled && selectImage(index)"
            @dblclick="!disabled && handleInsert(img)"
          >
            <el-image
              :src="img.img || img.url"
              :fit="'cover'"
              loading="lazy"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>

            <div class="image-info">
              <span class="image-id">
                {{ displayField === 'uuid' ? img.uuid : (img.targetId || img.id) }}
              </span>
              <span class="image-type">{{ getTypeLabel(img.fileType) }}</span>
            </div>

            <div v-if="selectedIndex === index" class="image-check">
              <el-icon><Check /></el-icon>
            </div>

            <el-button
                v-if="!disabled"
                class="image-insert-btn"
                size="small"
                type="primary"
                @click.stop="handleInsert(img)"
                plain
              >
                <el-icon><Plus /></el-icon> 插入
              </el-button>
          </div>
        </div>
      </el-form-item>

      <!-- 空状态 -->
      <el-form-item v-else-if="selectedArticle.length > 0 && articleCache.some(a => a.value === selectedArticle[0]) && filteredImageList.length === 0" label=" ">
        <el-empty
          :description="emptyText"
          :image-size="60"
        />
      </el-form-item>

      <!-- 提示信息 -->
      <el-form-item v-if="showHint && selectedArticle.length === 0" label=" ">
        <div class="image-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ hintText }}</span>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
// ============================================================
// 依赖导入
// ============================================================
import { ref, watch, computed } from 'vue';
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue';
import { Check, Plus, Loading, Picture, InfoFilled } from '@element-plus/icons-vue';
import PinyinMatch from 'pinyin-match';
import msg from '@/components/msg'
import { useUserConfigStore } from '@/store/userConfig';
const userConfigStore = useUserConfigStore()

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps({
  layout: {
    type: String,
    default: 'vertical',
    validator: (val) => ['vertical', 'horizontal'].includes(val)
  },
  title: {
    type: String,
    default: '引用图片'
  },
  searchLabel: {
    type: String,
    default: '搜索文章'
  },
  searchPlaceholder: {
    type: String,
    default: '请输入文章标题搜索已上传的图片'
  },
  searchWidth: {
    type: String,
    default: '400px'
  },
  emptyText: {
    type: String,
    default: '该文章暂无可用图片'
  },
  hintText: {
    type: String,
    default: '请搜索并选择一篇文章，将显示该文章关联的图片'
  },
  showHint: {
    type: Boolean,
    default: true
  },
  showClear: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  articleId: {
    type: Number,
    default: null
  },
  fetchArticlesApi: {
    type: Function,
    default: null
  },
  fetchImagesApi: {
    type: Function,
    default: null
  },
  imageType: {
    type: String,
    default: 'all',
    validator: (val) => ['all', 'cover', 'content'].includes(val)
  },
  showImageTypeSwitch: {
    type: Boolean,
    default: true
  },
  displayField: {
    type: String,
    default: 'id',
    validator: (val) => ['id', 'uuid'].includes(val)
  },
  articleTitle: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'select-article',
  'remove-article',
  'select-image',
  'insert-image',
  'clear',
  'image-type-change',
  'update:selected'
]);

// ============================================================
// 数据
// ============================================================

const selectedArticle = ref([]);
const imageList = ref([]);
const selectedIndex = ref(-1);
const loading = ref(false);
const articleCache = ref([]);
const currentImageType = ref(props.imageType);

// ============================================================
// 计算属性
// ============================================================

const filteredImageList = computed(() => {
  if (currentImageType.value === 'all') {
    return imageList.value;
  }
  return imageList.value.filter(img => img.fileType === currentImageType.value);
});

// ============================================================
// 搜索
// ============================================================

/**
 * 搜索文章：支持拼音、单词前缀、首字母匹配
 */
const fetchArticleForImage = async (params) => {
  const query = params.keyword || '';

  try {
    let data = [];

    if (props.fetchArticlesApi) {
      const result = await props.fetchArticlesApi(query);
      data = result.map(item => ({
        value: item.title || item.value,
        id: item.id
      }));
    } else {
      const { getArticleContentBusinessDataApi } = await import('@/api/business');
      const res = await getArticleContentBusinessDataApi();
      if (res.code === 200) {
        data = (res.data || []).map(item => ({
          value: item.title,
          id: item.id
        }));
      }
    }

    articleCache.value = data;

    if (!query) {
      return data;
    }

    const lowerQuery = query.toLowerCase();
    return data.filter(item => {
      const text = item.value;
      const lowerText = text.toLowerCase();

      if (lowerText.includes(lowerQuery)) return true;
      if (PinyinMatch.match(text, query)) return true;

      const words = lowerText.split(/[\s\-_]+/);
      for (const word of words) {
        if (word.startsWith(lowerQuery)) return true;
      }

      if (words.length > 1) {
        const initials = words.map(w => w[0]).join('');
        if (initials.includes(lowerQuery)) return true;
      }

      return false;
    });
  } catch (error) {
    console.error('搜索文章失败:', error);
    return [];
  }
};

/**
 * SmartAutoComplete 下拉显隐 → 通知父组件选中状态
 * 有搜索建议（含空格/空输入展示全部）时 true
 * 关闭时：仅当没选中文章才通知 false，避免匹配到数据后高度回缩
 */
const handleDropdownVisible = (visible) => {
  if (visible) {
    emit('update:selected', true);
  } else {
    // 下拉关闭但已选中文章 → 保持展开，不通知父组件收缩
    if (selectedArticle.value.length === 0) {
      emit('update:selected', false);
    }
  }
};

/**
 * 监听文章选择：v-model 双向绑定，选中后加载对应文章图片
 */
watch(selectedArticle, (newVal) => {
  if (newVal.length > 0) {
    const found = articleCache.value.find(item => item.value === newVal[0]);
    if (found) {
      loadImages(found.id);
      emit('select-article', { id: found.id, title: found.value });
    }
  } else {
    imageList.value = [];
    selectedIndex.value = -1;
    currentImageType.value = props.imageType;
    emit('remove-article');
    emit('update:selected', false);
  }
}, { deep: true });

// ============================================================
// 渲染（加载图片）
// ============================================================

/**
 * 加载文章关联的图片列表
 */
const loadImages = async (articleId) => {
  if (!articleId) {
    imageList.value = [];
    return;
  }

  loading.value = true;
  try {
    if (props.fetchImagesApi) {
      const result = await props.fetchImagesApi(articleId);
      imageList.value = Array.isArray(result) ? result : [];
    } else {
      const { fileMetaListApi } = await import('@/api/filemeta');
      const res = await fileMetaListApi(1, 100, {
        targetIds: articleId,
        fileType: ''
      });
      if (res.code === 200) {
        const allowedTypes = currentImageType.value === 'all'
          ? ['cover', 'content']
          : [currentImageType.value];
        imageList.value = (res.data.items || []).filter(item =>
          allowedTypes.includes(item.fileType) && item.img
        );
      } else {
        imageList.value = [];
      }
    }
  } catch (error) {
    console.error('加载文章图片失败:', error);
    imageList.value = [];
    msg.warning('加载图片失败，请重试');
  } finally {
    loading.value = false;
  }
};

/**
 * 手动加载指定文章的图片（用于编辑回显、草稿恢复）
 * @param {Number} id 文章 ID
 * @param {String} title 可选：指定显示标题。不传时自动从 articleCache 反查，未命中则回退 articleTitle prop
 */
const loadByArticleId = async (id, title) => {
  if (id) {
    if (title) {
      selectedArticle.value = [title];
    } else {
      const found = articleCache.value.find(item => item.id === id);
      if (found) {
        selectedArticle.value = [found.value];
      } else {
        selectedArticle.value = [props.articleTitle || `ID: ${id}`];
      }
    }
    await loadImages(id);
  }
};

const getCurrentArticleId = () => {
  if (selectedArticle.value.length === 0) return null;
  const title = selectedArticle.value[0];
  const found = articleCache.value.find(item => item.value === title);
  return found ? found.id : null;
};

const getTypeLabel = (type) => {
  const map = {
    'cover': '封面',
    'content': '内容图',
    'carousel': '轮播图',
    'avatar': '头像'
  };
  return map[type] || type || '未知';
};

/**
 * 处理图片类型切换：重新加载并重置选中
 */
const handleImageTypeChange = (val) => {
  if (selectedArticle.value.length > 0) {
    const articleId = getCurrentArticleId();
    if (articleId) {
      loadImages(articleId);
    }
  }
  selectedIndex.value = -1;
  emit('image-type-change', val);
};

// ============================================================
// 选择 / 插入 / 清空
// ============================================================

const selectImage = (index) => {
  if (props.disabled) return;
  selectedIndex.value = index;
  const img = filteredImageList.value[index];
  emit('select-image', { ...img, index });
};

/**
 * 插入图片：生成 Markdown 格式并通过 emit 传出
 */
const handleInsert = (img) => {
  if (props.disabled) return;

  if (!img || !(img.img || img.url)) {
    msg.warning('图片地址无效');
    return;
  }

  const imageUrl = img.img || img.url;
  const title = img.title || img.fileType || '图片';

  emit('insert-image', {
    ...img,
    url: imageUrl,
    markdown: `![${title}](${imageUrl})`
  });
};

const handleClear = () => {
  selectedArticle.value = [];
  imageList.value = [];
  selectedIndex.value = -1;
  currentImageType.value = props.imageType;
  emit('clear');
  emit('update:selected', false);
};

const resetSelection = () => {
  selectedIndex.value = -1;
};

// ============================================================
// Watch
// ============================================================

/* watch(() => props.articleId, (newVal) => {
  if (newVal) {
    loadByArticleId(newVal);
  }
}, { immediate: true }); */

// ============================================================
// 暴露方法
// ============================================================

defineExpose({
  imageList,
  loadImages,
  loadByArticleId,
  resetSelection,
  clear: handleClear,
  getSelectedArticle: () => selectedArticle.value,
  getSelectedArticleId: () => getCurrentArticleId(),
  getImageList: () => imageList.value,
  getFilteredImageList: () => filteredImageList.value,
  getSelectedImage: () => filteredImageList.value[selectedIndex.value] || null,
  setImageType: (type) => {
    if (['all', 'cover', 'content'].includes(type)) {
      currentImageType.value = type;
      if (selectedArticle.value.length > 0) {
        const articleId = getCurrentArticleId();
        if (articleId) {
          loadImages(articleId);
        }
      }
    }
  },
  getImageType: () => currentImageType.value
});

</script>

<style scoped lang="scss">
.image-reference {
  padding: 12px 0;

  .image-reference-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /*margin-bottom: 12px;*/

    .image-reference-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .image-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .el-icon {
      font-size: 18px;
    }
  }

  .image-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .el-icon {
      font-size: 16px;
      color: var(--el-color-info);
    }
  }

  // ============================================================
  // 统一图片容器（横排/竖排共用）
  // ============================================================
  .image-container {
    display: flex;
    gap: 12px;
    padding: 4px;
    max-height: 380px;

    // 竖排模式
    &.layout-vertical {
      flex-direction: column;
      overflow-x: visible;
      overflow-y: auto;
      align-items: stretch;
      flex-shrink: 0;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: var(--el-fill-color);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 2px;
      }

      .image-item {
        flex: 0 0 160px;
        aspect-ratio: 16 / 9;
        width: 100%;
        max-width: 280px;
      }
    }

    // 横排模式
    &.layout-horizontal {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
      display: flex;
      padding: 20px;
      flex-shrink: 0;
      width: 100%;
      align-items: stretch;

      &::-webkit-scrollbar {
        height: 5px;
      }

      &::-webkit-scrollbar-track {
        background: var(--el-fill-color);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 2px;
      }

      .image-item {
        flex: 0 0 220px;
        aspect-ratio: 16 / 9;
      }
    }

    // ============================================================
    // 图片卡片（横排/竖排共用）
    // ============================================================
    .image-item {
      position: relative;
      border-radius: 8px;
      border: 2px solid var(--el-border-color-lighter);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.25s ease;
      background: var(--el-bg-color);

      &:hover:not(.image-disabled) {
        border-color: var(--el-color-primary-light-5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.image-selected {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
      }

      &.image-disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .el-image {
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }

      // 图片信息（底部遮罩）
      .image-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: #fff;
        font-size: 11px;

        .image-id {
          opacity: 0.85;
          font-size: 10px;
        }

        .image-type {
          background: rgba(255, 255, 255, 0.2);
          padding: 0 6px;
          border-radius: 3px;
          font-size: 10px;
        }
      }

      // 选中对勾
      .image-check {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--el-color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      // 插入按钮（hover 显示）
      .image-insert-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0;
        transition: all 0.25s ease;

        .el-icon {
          margin-right: 2px;
          font-size: 12px;
        }
      }

      &:hover:not(.image-disabled) .image-insert-btn {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }

  // 图片占位（加载失败）
  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 12px;

    .el-icon {
      font-size: 24px;
      opacity: 0.5;
    }
  }

  :deep(.el-empty) {
    padding: 20px 0;
  }
}
</style>
