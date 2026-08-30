<template>
  <div class="image-management">
    <!-- ===== 搜索栏 ===== -->
    <div class="management-header">
      <div class="search-area">
        <SmartAutoComplete
          v-model="selectedSearch"
          :fetch-suggestions-api="fetchBusinessData"
          placeholder="搜索文章/用户/轮播标题"
          :max="1"
          :debounce-delay="300"
          :min-search-length="1"
          :multiple-id-mode="true"
          :auto-search-on-enter="true"
          @select-multiple-ids="handleSearchSelect"
          @tag-removed="handleSearchRemoved"
          style="width: 320px"
        />
      </div>
    </div>

    <!-- ===== 筛选栏 ===== -->
    <div class="filter-toolbar">
      <!-- 图片类型切换 -->
      <el-radio-group v-model="currentImageType" @change="handleTypeChange" size="small">
        <el-radio-button value="all">全部图片</el-radio-button>
        <el-radio-button value="cover">封面</el-radio-button>
        <el-radio-button value="content">内容图</el-radio-button>
        <el-radio-button value="carousel">轮播</el-radio-button>
        <el-radio-button value="notice">公告</el-radio-button>
        <el-radio-button value="avatar">头像</el-radio-button>
      </el-radio-group>

      <!-- 原始上传筛选 -->
      <el-checkbox v-model="filterOriginal" @change="handleFilterChange" size="small">
        仅原始上传
      </el-checkbox>

      <!-- 显示字段切换 -->
      <el-radio-group v-model="displayField" size="small" style="margin-left: 16px;">
        <el-radio-button value="id">ID</el-radio-button>
        <el-radio-button value="uuid">UUID</el-radio-button>
        <el-radio-button value="businessId">BusinessID</el-radio-button>
        <el-radio-button value="title">标题</el-radio-button>
      </el-radio-group>

      <!-- 复制格式下拉选择 -->
      <SmartSelector 
        size="small"
        v-model="copyFormat" 
        :data="copyFormatOptions" 
        style="width: 160px; margin-left: 12px;" 
        placeholder="复制格式(默认md)"
      />

      <!-- 排序 -->
      <SmartSelector size="small" v-model="sortField" :data="softFields" style="width: 200px; margin-left: 16px;" placeholder="请选择排序">
      </SmartSelector>
      <span style="display: inline-flex; gap: 0;">
        <el-button size="small" :type="sortOrder === 'ASC' ? 'primary' : ''" icon="Top" @click="setSortOrder('ASC')" circle plain />
        <el-button size="small" :type="sortOrder === 'DESC' ? 'primary' : ''" icon="Bottom" @click="setSortOrder('DESC')" circle plain />
        <el-button size="small" type="info" icon="Refresh" @click="onReset" circle plain />
      </span>
    </div>

    <!-- ===== 图片网格 ===== -->
    <div class="image-grid" v-loading="loading">
      <div
        v-for="(img, index) in imageList"
        :key="img.id"
        class="image-card"
        @mouseenter="hoveredId = img.id"
        @mouseleave="hoveredId = null"
      >
        <el-image
          :src="img.img"
          :fit="'cover'"
          class="image-preview"
          loading="lazy"
          @click="openPreview(index)"
        >
          <template #error>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>

        <!-- 图片信息（底部信息栏 + 操作按钮） -->
        <div class="image-footer">
          <span v-show="hoveredId !== img.id" class="image-info-text">
            {{ displayField === 'id' ? `ID: ${img.id}` : '' }}
            {{ displayField === 'uuid' ? `UUID: ${img.uuid}` : '' }}
            {{ displayField === 'businessId' ? `BusinessID: ${img.targetId || '-'}` : '' }}
            {{ displayField === 'title' ? `标题: ${img.title || '-'}` : '' }}
          </span>
          <!-- 操作按钮组（悬浮显示，方便以后新增/删改） -->
          <div v-show="hoveredId === img.id" class="image-footer-actions">
            <el-button size="small" type="primary" @click.stop="openPreview(index)" plain>预览</el-button>
            <el-button size="small" type="warning" @click.stop="handleCopy(img)" plain>复制</el-button>
            <!-- 占位：下载 -->
            <el-button size="small" type="success" @click.stop="handleDownload(img)" plain>下载</el-button>
            <!-- 占位：删除 -->
            <el-button size="small" type="danger" plain>删除</el-button>
          </div>
          <el-tag :type="getFileTypeTag(img.fileType)" size="small">
            {{ getFileTypeLabel(img.fileType) }}
            <span v-if="img.isOriginal === 1" class="original-badge">原</span>
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && imageList.length === 0" description="暂无图片" :image-size="80" />

    <!-- ===== 图片预览器（全局单例，避免网格多实例同步冲突） ===== -->
    <el-image-viewer
      v-if="viewerVisible"
      :url-list="previewSrcList"
      :initial-index="previewIndex"
      @close="viewerVisible = false"
      teleported
    />

    <!-- ===== 分页 ===== -->
    <div class="pagination-container">
      <el-pagination
        size="small"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[2, 5, 7, 10]"
        layout="jumper, sizes, total, ->, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </div>
  </div>
</template>

<script setup>
// 1. 框架核心
import { ref, onMounted, watch } from 'vue'

// 2. 页面组件
import SmartAutoComplete from '@/views/components/SmartAutoComplete.vue'
import SmartSelector from '@/views/components/SmartSelector.vue'

// 3. UI 库
import msg from '@/components/msg'
import { Picture, CopyDocument } from '@element-plus/icons-vue'

// 4. 第三方插件
import PinyinMatch from 'pinyin-match'

// 5. API
import { fileMetaListApi } from '@/api/filemeta'
import { getAllBusinessDataApi } from '@/api/business'

// ============================================================
// 数据
// ============================================================

// 响应式状态
const loading = ref(false)
const imageList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(24)
const hoveredId = ref(null)

// 筛选条件
const currentImageType = ref('all')
const filterOriginal = ref(false)
const displayField = ref('id')
const copyFormat = ref('')
const selectedSearch = ref([])
const searchIds = ref('')

// 排序
const sortField = ref('create_time')
const sortOrder = ref('DESC')
const softFields = ref([
    { label: '请选择排序', value: '', disabled: true },
    { label: '业务主键ID', value: 'target_id' },
    { label: '创建时间', value: 'create_time' },
    { label: '修改时间', value: 'update_time' }
])

// 缓存业务数据
const businessDataCache = ref([])

// 预览大图列表（ref：在 fetchImages 中手动赋值，避免 computed 频繁触发重渲染）
const previewSrcList = ref([])

// 预览器控制（全局单例，避免网格多实例同步冲突）
const viewerVisible = ref(false)
const previewIndex = ref(0)

// ============================================================
// 工具函数
// ============================================================

const getFileTypeLabel = (type) => {
  const map = {
    'avatar': '头像',
    'cover': '封面',
    'carousel': '轮播图',
    'content': '内容',
    'notice': '公告'
  };
  return map[type] || type;
};

const getFileTypeTag = (type) => {
  const map = {
    'avatar': 'primary',
    'cover': 'success',
    'carousel': 'warning',
    'content': 'info',
    'notice': 'info'
  };
  return map[type] || '';
};

// ============================================================
// 渲染
// ============================================================

/**
 * 分页加载图片列表，根据当前筛选条件请求数据
 */
const fetchImages = async () => {
  loading.value = true;
  try {
    const params = {};
    
    // 类型筛选
    if (currentImageType.value !== 'all') {
      params.fileType = currentImageType.value;
    }
    
    // 原始上传筛选
    if (filterOriginal.value) {
      params.isOriginal = 1;
    }
    
    // 业务ID筛选
    if (searchIds.value) {
      params.targetIds = searchIds.value;
    }

    // 确保只展示未删除的图片
    params.isDeleted = 0

    // 排序参数
    if (sortField.value) {
      params.sortField = sortField.value;
      params.sortOrder = sortOrder.value;
    }

    const res = await fileMetaListApi(currentPage.value, pageSize.value, params);
    if (res.code === 200) {
      imageList.value = res.data.items || [];
      total.value = res.data.total || 0;
      // 同步更新预览列表，过滤无效 URL 防止闪屏
      previewSrcList.value = imageList.value.map(i => i.img).filter(Boolean);
    } else {
      msg.error(res.msg || '查询失败');
    }
  } catch (error) {
    console.error('加载图片失败:', error);
    msg.error('加载失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchImages();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchImages();
};

// ============================================================
// 搜索和重置
// ============================================================

const loadBusinessData = async () => {
  try {
    const res = await getAllBusinessDataApi();
    if (res.code === 200) {
      businessDataCache.value = (res.data || []).map(item => ({
        value: item.title,
        id: item.id
      }));
    }
  } catch (error) {
    console.error('加载业务数据失败:', error);
  }
};

const fetchBusinessData = async (params) => {
  const query = params.keyword || '';
  
  if (businessDataCache.value.length === 0) {
    await loadBusinessData();
  }
  
  if (!query) {
    return businessDataCache.value;
  }
  
  const lowerQuery = query.toLowerCase();
  return businessDataCache.value.filter(item => {
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
};

const handleSearchSelect = (data) => {
  if (data.ids && data.ids.length > 0) {
    // 多ID模式：强制切换到 all
    if (data.ids.length > 1) {
      currentImageType.value = 'all';
    }
    searchIds.value = data.ids.join(',');
    currentPage.value = 1;
    fetchImages();
  }
};

const handleSearchRemoved = () => {
  searchIds.value = '';
  currentPage.value = 1;
  fetchImages();
};

// ============================================================
// 筛选
// ============================================================

const handleTypeChange = () => {
  currentPage.value = 1;
  fetchImages();
};

const handleFilterChange = () => {
  currentPage.value = 1;
  fetchImages();
};

// 设置排序方向（自动触发查询）
const setSortOrder = (order) => {
  sortOrder.value = order
}

// 排序变化自动查询
watch([sortField, sortOrder], () => {
  currentPage.value = 1;
  fetchImages();
})

// 重置筛选条件
const onReset = () => {
  currentImageType.value = 'all'
  filterOriginal.value = false
  displayField.value = 'id'
  copyFormat.value = ''
  sortField.value = 'create_time'
  sortOrder.value = 'DESC'
  selectedSearch.value = []
  searchIds.value = ''
  currentPage.value = 1
  fetchImages()
}

// ============================================================
// 图片预览（全局单例 el-image-viewer）
// ============================================================

const openPreview = (index) => {
  previewIndex.value = index
  viewerVisible.value = true
}

// ============================================================
// 下载功能
// ============================================================

const handleDownload = async (img) => {
  try {
    const res = await fetch(img.img)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const ext = (img.img.split('.').pop() || 'png').split('?')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `${img.uuid || 'image'}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(img.img, '_blank')
  }
}

// ============================================================
// 复制功能
// ============================================================

// 复制格式选项
const copyFormatOptions = [
  { label: '复制格式(默认md)', value: '' },
  { label: 'UUID', value: 'uuid' },
  { label: 'OSS路径', value: 'ossPath' },
]

const handleCopy = async (img) => {
  let copyText = '';
  
  // 根据选择的格式生成复制内容
  switch (copyFormat.value) {
    case 'uuid':
      copyText = img.uuid;
      break;
    case 'ossPath':
      copyText = img.ossPath;
      break;
    case 'markdown':
    default:
      const title = img.title || img.fileType || '图片';
      copyText = `![${title}](${img.img})`;
      break;
  }
  
  try {
    await navigator.clipboard.writeText(copyText);
    msg.primary('已复制到剪贴板');
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = copyText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    msg.primary('已复制到剪贴板');
  }
};

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  loadBusinessData();
  fetchImages();
});
</script>

<style scoped lang="scss">
// ============================================================
// 根布局
// ============================================================
.image-management {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ============================================================
// 头部搜索
// ============================================================
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// ============================================================
// 筛选栏
// ============================================================
.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

// ============================================================
// 图片网格
// ============================================================
.image-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  align-content: start;
  overflow-y: auto;
  padding: 4px 0;
  min-height: 200px;

  // 滚动条
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
}

// ============================================================
// 图片卡片
// ============================================================
.image-card {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
  }
}

.image-preview {
  width: 100%;
  height: 100%;
  display: block;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 32px;
}

.image-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 4px 6px;
  // 整条 footer 的渐变遮罩
  background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2) 35%);
  gap: 6px;

  .image-info-text {
    font-size: 11px;
    color: #fff;
    opacity: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    margin-right: auto;  // 把右侧内容推到最右
  }

  // 操作按钮组 — 绝对定位，始终水平居中于 footer
  .image-footer-actions {
    display: flex;
    align-items: center;
    gap: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);  // ← 真正水平居中，与 tag / info 无关
    background: rgba(0, 0, 0, 0.25);  // 按钮组暗底（调浅）
    border-radius: 4px;
    backdrop-filter: blur(3px);

    .el-button {
      height: 20px;
      padding: 0 5px;
      font-size: 10px;
      text-align: center;
      border-radius: 0;

      &:first-child { border-radius: 3px 0 0 3px; }
      &:last-child  { border-radius: 0 3px 3px 0; }

      &.is-disabled {
        cursor: not-allowed;
      }
    }
  }

  .el-tag {
    flex-shrink: 0;
    font-size: 10px;
    height: 18px;
    line-height: 16px;
    padding: 0 5px;

    .original-badge {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      padding: 0 3px;
      margin-left: 2px;
      font-size: 9px;
    }
  }
}

// ============================================================
// 分页
// ============================================================
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0 0;
  flex-shrink: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

// ============================================================
// Element Plus 覆盖
// ============================================================
:deep(.el-radio-group) {
  .el-radio-button__inner {
    padding: 6px 14px;
    font-size: 12px;
  }
}

:deep(.el-checkbox) {
  .el-checkbox__label {
    font-size: 12px;
  }
}

/* 悬浮图片卡片时，el-tag 低调化（不和操作按钮抢视觉） */
.image-card:hover {
  :deep(.el-tag) {
    color: var(--el-text-color-regular) !important;
    background-color: var(--el-fill-color-light) !important;
    border-color: var(--el-border-color) !important;
  }
}
</style>

<style lang="scss">
/* ===== image 卡片 footer 按钮组 — uiMode 颜色适配 ===== */

/* full — 中性半透白，hover 填主色 */
.ui-full .image-footer-actions .el-button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75) !important;
}
.ui-full .image-footer-actions .el-button:hover:not(.is-disabled) {
  color: var(--el-color-primary-text) !important;
  background: var(--el-color-primary) !important;
}
.ui-full .image-footer-actions .el-button.is-disabled {
  color: rgba(255, 255, 255, 0.3);
}

/* plain — 中性半透白（融入暗底），hover 填主色 */
.ui-plain .image-footer-actions .el-button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}
.ui-plain .image-footer-actions .el-button:last-child {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}
.ui-plain .image-footer-actions .el-button:hover:not(.is-disabled) {
  border-color: 1px solid var(--el-color-primary-plain)!important;
  color: var(--el-color-primary-plain) !important;
  background: var(--el-color-primary-plain-bg) !important;
}
.ui-plain .image-footer-actions .el-button.is-disabled {
  color: rgba(255, 255, 255, 0.3);
}
</style>