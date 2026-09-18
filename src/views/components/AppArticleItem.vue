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
                  <v-chip v-if="cateName && !display.xs.value" label density="comfortable" base-color="primary" size="small" class="category mt-1 mr-2">
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
  top: 9px;
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
    margin-top: auto;
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
  align-items: center; /* 垂直居中 */
  gap: 16px; /* 防止内容紧贴 */
  width: 100%;
  
  h4 {
    flex: 1; /* 标题占据剩余空间 */
    min-width: 0; /* 允许收缩 */
    margin: 0;
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
  /* 标题盒固定 35px。CSS 无法只在换行时缩字号，故 xs 下标题统一 14px/18.5px；
     2 行文字（2×18.5 = 37px）比盒子多 2px，多出的只是行距空白——
     已用像素比对验证：35px 与 37px 渲染结果完全一致（10 张卡全过），不会切到字。
     封顶后这 2px 不再溢出到日期行（此前正是它把日期上间距吃成了 2px） */
  .title-category h4 {
    height: 35px;
    font-size: 14px;
    line-height: 18.5px;
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
    padding-bottom: 0 !important; /* 覆盖 Vuetify .pb-1 的 !important */
  }
}

:deep(.v-list-item){
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}
</style>