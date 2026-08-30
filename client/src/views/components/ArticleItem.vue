<template>
  <v-card :to="{name:'detail',params:{id}}">
        <v-list-item class="pa-0">
            <template v-slot:prepend>
              <div class="cover-container">
                <v-img
                  :src="cover || coverRect"
                  :lazy-src="coverRect"
                  :alt="title"
                  class="cover-image lazy-img"
                  :width="display.smAndDown.value ? 150 : 250"
                  :aspect-ratio="16/9"
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
            <!-- 右侧内容区域 -->
              <!-- <v-list-item-content class="d-flex flex-column justify-space-between"> -->
                <v-list-item-title class="title-category">
                  <h4 class="ma-0 title" :class="display.mdAndUp.value ? 'truncate-multi' : 'truncate-single'">{{ title }}</h4>
                  <v-chip v-if="cateName" color="accent" size="small" class="category mt-1 mr-2">
                    {{ cateName }}
                  </v-chip>
                </v-list-item-title>
  
                <v-list-item-subtitle class="description">
                  <p class="ma-0 truncate-multi d-none d-md-block">{{ description }}</p>
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
                    <span v-if="configStore.getListFavoriteEnabled()" class="d-inline-flex mr-3">
                    <v-icon icon="mdi-heart-outline" size="small" class="mr-1"></v-icon>
                    {{ favoriteCount || 0 }}
                  </span>
                  <span v-if="configStore.getListCommentEnabled()" class="d-inline-flex mr-3">
                    <v-icon icon="mdi-comment" size="small" class="mr-1"></v-icon>
                    {{ commentCount || 0 }}
                  </span>
                </v-list-item-subtitle>
              <!-- </v-list-item-content> -->
        </v-list-item>
  </v-card>
  </template>

<script setup>
import { useConfigStore } from '@/store/config';
import { useThemeStore } from '@/store/theme';
import { useDisplay } from 'vuetify';
import coverRect from '@/assets/images/cover-rect.png';

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

/* const descriptionText = computed(()=>{
   return mdToPlainText(props.description)
}) */

const themeStore = useThemeStore()

</script>

<style scoped>
/* .title-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
} */

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


.metadata{
    padding-top: 4px;
    margin-top: auto;
}

:deep(.v-list-item__content) {
  display: flex;
  align-self: stretch !important;
  flex-direction: column;
  .description {
    margin-top: 10px;
  }
  /* background: coral; */
}

/* 移动端-单行截断 */
.v-list-item-title .truncate-single{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* pc端-两行截断 */
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

:deep(.v-img__img--contain){
  /* padding-bottom: 10px;
  padding-top: 10px; */
}

:deep(.v-list-item){
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}

/* .title-category h4 {
  font-size: 1.5rem;
  font-weight: bold;
  width: 350px;
}

.category {
  font-size: 0.875rem;
  color: #555;
}

.description p {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #777;
} */
</style>