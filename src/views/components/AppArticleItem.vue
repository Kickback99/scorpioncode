<template>
  <v-card :to="{name:'detail',params:{id}}">
        <v-list-item class="pa-0">
            <!-- ===== 封面 ===== -->
            <template v-slot:prepend>
              <div class="cover-container">
                <v-img
                  :src="cover || coverRect"
                  :lazy-src="coverRect"
                  :alt="title"
                  class="cover-image lazy-img"
                  :width="display.xs.value ? 110 : display.smAndDown.value ? 150 : 250"
                  :aspect-ratio="display.xs.value ? undefined : 16/9"
                  cover
                />

                <!-- 桌面端置顶徽章 -->
                  <v-sheet :class="[
                    'ribbon-window',
                    themeStore.isDark ? 'bg-secondary-darken-1' : 'bg-secondary-lighten-1'
                  ]" v-if="isTop === '1' && !display.smAndDown.value">
                    <span>
                        置顶
                    </span>
                  </v-sheet>

                  <!-- 移动端置顶图标按钮 -->       
                  <v-btn 
                    v-if="isTop === '1' && display.smAndDown.value"
                    class="top-btn-mobile"
                    variant="flat"
                    color="primary"
                    density="comfortable"
                    icon="mdi-pin"
                    size="x-small"
                    rounded="sm"
                  >
                    <v-icon size="14">mdi-pin</v-icon>
                  </v-btn>
                </div>
            </template>
                <!-- ===== 右侧内容区域 ===== -->
                <v-list-item-title class="title-category">
                  <h4 class="ma-0 title" :class="display.sm.value ? 'truncate-single' : 'truncate-multi'">{{ title }}</h4>
                  <v-chip v-if="cateName && !display.xs.value" label density="comfortable" base-color="primary" size="small" class="category mr-2">
                    {{ cateName }}
                  </v-chip>
                </v-list-item-title>
  
                <v-list-item-subtitle class="description d-none d-md-block">
                  <p class="ma-0 truncate-multi">{{ description }}</p>
                </v-list-item-subtitle>
  
                <v-list-item-subtitle class="metadata pb-1">
                  <span class="d-inline-flex mr-3">
                       <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
                    {{  createTime }}
                  </span>
                  <span v-if="configStore.getListViewEnabled()" class="d-inline-flex mr-3">
                      <v-icon icon="mdi-eye" size="small" class="mr-1"></v-icon>
                    {{ viewCount }}
                  </span>
                    <span v-if="configStore.getListFavoriteEnabled() && !display.xs.value" class="d-inline-flex mr-3">
                    <v-icon icon="mdi-heart-outline" size="small" class="mr-1"></v-icon>
                    {{ favoriteCount || 0 }}
                  </span>
                  <span v-if="configStore.getListCommentEnabled() && !display.xs.value" class="d-inline-flex mr-3">
                    <v-icon icon="mdi-comment" size="small" class="mr-1"></v-icon>
                    {{ commentCount || 0 }}
                  </span>
                </v-list-item-subtitle>
        </v-list-item>
  </v-card>
  </template>

<script setup>
import { useConfigStore } from '@/store/config';
import { useThemeStore } from '@/store/theme';
import { useDisplay } from 'vuetify';
import coverRect from '@/assets/images/cover-rect.png';

// ============================================================
// 数据
// ============================================================
const display = useDisplay()
const configStore = useConfigStore()

/* const posts = ref([
  {
    id: 1,
    // title: '关于标题的编写很重要的而关于这个标题的长度会可能挺长的',
    title: '关于标题的编写很重要的而关于这个标题的长度会可能挺长的关于标题的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的编写很重要的而关于这个标题的长度会可能挺长的',
    category: '文章分类名',
    description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    publishDate: '2025-04-21',
    comments: 15,
    views: 1024
  },
  // 添加更多文章
]) */


const props = defineProps(['id','title','cateName','cover','description','createTime','viewCount', 'favoriteCount', 'commentCount', 'isTop'])

const themeStore = useThemeStore()

</script>

<style scoped>
/* ============================================================
   封面与置顶徽章
   ============================================================ */
/* 封面容器 - 相对定位 */
.cover-container {
  position: relative;
  display: inline-block;
  margin: 0 20px 0 12px;
}

.cover-image {
  border-radius: var(--article-cover-radius);
  overflow: hidden;
}

.ribbon-window {
  position: absolute;
  top: 10%;
  right: -4px;
  padding: 2px 10px;
  /* background-color: #57DD43; */
  font-size: 12px;
  /* color: #fff; */

  &::before {
    content: "";
    position: absolute;
    right: 0;
    bottom: -4px;
    /* border-top: 4px solid #57DD43; */
    border-top: 4px solid rgb(var(--v-theme-primary));
    border-right: 4px solid transparent;
  }
}

/* 移动端置顶图标按钮样式 */
.top-btn-mobile {
  position: absolute;
  top: 5px;
  right: 5px;
  min-width: 24px;
  width: 24px;
  height: 24px;
  opacity: 0.9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  
  &:active {
    opacity: 1;
  }
}

/* 可选：添加点击波纹效果（如果需要） */
.top-btn-mobile::before {
  background-color: rgba(255,255,255,0.3);
}


/* ============================================================
   卡片布局与元信息
   ============================================================ */
.metadata{
    padding-top: 8px;
    /* 去 Vuetify .pb-1 的 4px：内容底要贴住盒底（= 封面底） */
    padding-bottom: 0 !important;
    margin-top: auto;
    /* flex 行：行盒不再被本行 strut 降部占去 3.2px，图标/日期才能贴底对齐封面 */
    display: flex;
    align-items: center;
    /* 不补偿图标字形自带的 2px 留白：压到 0 会让整行相对文字基线偏下（见 docs） */
    /* 日期/阅读量等元信息强制单行，避免窄屏下折行 */
    white-space: nowrap;
}

:deep(.v-list-item__content) {
  display: flex;
  align-self: stretch !important;
  flex-direction: column;
  /* background: coral; */
}

/* 描述块只在 md+ 可见（p 上是 d-none d-md-block），
   10px 间距因此也只在 md+ 占位，xs/sm 下不再白留这段死空间 */
@media (min-width: 960px) {
  :deep(.v-list-item__content) .description {
    margin-top: 10px;
  }
}

/* ============================================================
   标题与简介截断
   ============================================================ */
/* sm 端-单行截断 */
.v-list-item-title .truncate-single{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* pc端-标题两行截断 */
.v-list-item-title .truncate-multi,
.v-list-item-subtitle .truncate-multi {

  display: -webkit-box;
  white-space: wrap !important;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* 简介单独放宽到 3 行：md 上标题最多 2 行，2 行标题 + 3 行简介 = 137.9px，
   仍在封面高度 140.6px 之内，卡片才能保持等高；放宽到 4 行就会把卡片撑高 */
.v-list-item-subtitle .truncate-multi {
  -webkit-line-clamp: 3;
}



/* ============================================================
   标题与分类行
   ============================================================ */
.title-category {
  display: flex;
  justify-content: space-between; /* 两端对齐，标题在左，分类在右 */
  align-items: flex-start; /* 顶部对齐：标题折成 2 行时分类 chip 不能被居中拉到中间 */
  gap: 16px; /* 防止内容紧贴 */
  width: 100%;
  /* 整行上移，让首行墨迹顶落在封面顶边上（不动布局；标题与 chip 一起移，不错位） */
  position: relative;
  top: calc(-1 * var(--article-title-lift));
  
  h4 {
    flex: 1; /* 标题占据剩余空间 */
    min-width: 0; /* 允许收缩 */
    margin: 0;
    /* 字号/行高统一取 main.scss 的 --article-title-*（原 sm 及以上是隐式继承 1rem） */
    font-size: var(--article-title-fs);
    line-height: var(--article-title-lh);
  }
}

/* chip 顶边对齐标题首行的墨迹顶：20px 字号 / 27px 行高下，首行墨迹比行盒顶低 3.2px。
   此前靠模板的 `mt-1`（4px）配合垂直居中，标题折成 2 行时 chip 会被居中拉到整块中间 */
.category {
  margin-top: 3.2px;
}

/* sm 及以上（≥600px）：分类 chip 用 14px/26px。标题已是 20px/700，chip 若停在 Vuetify small 的
   12px，会比日期、阅读量（14px）还小——全卡最小的字去承担分类标签，层级是反的。
   xs（<600px）本就不渲染 chip（见模板 v-if），这里把边界写明确，不做隐式假设。
   26px 是上限：再高（含 3.2px 上边距）就会顶破单行标题的 27px 行盒，把简介往下推 */
@media (min-width: 600px) {
  .category.v-chip {
    height: 26px;
    font-size: 14px;
  }
}

/* 对齐侧边栏「文章标签」chip：tonal 把文字染成 primary 对比度不足，改用 on-surface（须只覆盖内容区，动根节点底纹会跟着变） */
.category :deep(.v-chip__content) {
  color: rgb(var(--v-theme-on-surface));
}

/* ============================================================
   xs（<600px）：卡片恒高
   ============================================================
   1) 标题预留 2 行——1 行标题的卡片也占 2 行的高度
   2) 图片去掉固定宽高比（见模板 :aspect-ratio），高度跟随文字栏
   两者配合保证：不论标题是否换行卡片高度一致，且图片与文字栏上下两端对齐 */
@media (max-width: 599.98px) {
  /* 标题盒定高 2 行（= 2 × lh）：1 行标题也占 2 行高 → 卡片恒高，且不会切到降部 */
  .title-category h4 {
    height: calc(var(--article-title-lh) * 2);
  }

  :deep(.v-list-item__prepend) {
    align-self: stretch;
  }

  .cover-container,
  .cover-image {
    height: 100%;
  }

  /* 日期行：盒高 32px（与骨架屏 .skeleton-meta 同值），在其内部把上下重分配为
     上 12 / 下 0 —— 日期距标题、距卡片下沿都约 13px。此前 8/4 时上方仅 9px，
     因为标题溢出的 2px 吃掉了 padding-top；标题封顶后不会再被吃，
     所以不用靠加大 padding 撑（那只会让卡片变高） */
  .metadata {
    height: 32px;
    padding-top: 12px;
    /* 32px 盒比内容（图标 17.5px）高，内容压到底边，才能贴住封面底 */
    align-items: flex-end;
  }
}

:deep(.v-list-item){
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}
</style>