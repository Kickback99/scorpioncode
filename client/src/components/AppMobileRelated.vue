<template>
  <div v-if="smAndDown && (tagList.length > 0 || articleList.length > 0)" class="mt-5" :style="{ '--related-scale': scale }">
    <!-- 相关文章 — 完全复用 AppSidebar 样式 -->
    <AppBlogBox :title="titles.articles">
      <v-list>
        <v-list-item
          v-for="(item, index) in articleList"
          :key="item.id"
          :value="item.id"
          :to="{ name: 'detail', params: { id: item.id } }"
        >
          <template v-slot:prepend>
            <v-img
              class="customImg"
              :src="item.cover || coverRect"
              width="90"
            />
          </template>
          <v-list-item-title class="text-caption">{{ item.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ item.createTime }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </AppBlogBox>

    <!-- 相关标签 — 完全复用 AppSidebar 样式 -->
    <AppBlogBox :title="titles.tags">
      <v-chip-group column class="pa-2" mandatory>
        <v-chip
          label
          v-for="item in tagList"
          :key="item.id"
          density="comfortable"
          size="small"
          :value="item.id"
          base-color="primary"
          @click="onSearch('tag', item.id)"
        >{{ item.name }}</v-chip>
      </v-chip-group>
    </AppBlogBox>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import AppBlogBox from './AppBlogBox.vue'
import { useSearch } from '@/utils/useSearch'
import { useDialogFontScale } from '@/composables/useDialogFontScale'
import coverRect from '@/assets/images/cover-rect.png'

const { smAndDown } = useDisplay()
const scale = useDialogFontScale()
const { triggerSearch } = useSearch()

const props = defineProps({
  tags: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] }
})

// 复用 AppSidebar 的搜索逻辑
const onSearch = (type, param) => {
  triggerSearch(type, param)
}

// 复用 AppSidebar 的动态标题
const titles = ref({
  tags: '相关标签',
  articles: '相关文章'
})

const tagList = ref([])
const articleList = ref([])

// 同步 props → 本地 ref，与 AppSidebar handleDetailData 逻辑一致
watch(() => props.tags, (val) => {
  if (val && val.length > 0) {
    titles.value.tags = '标签'
    tagList.value = val
  }
}, { immediate: true })

watch(() => props.articles, (val) => {
  if (val && val.length > 0) {
    titles.value.articles = '相关文章'
    articleList.value = val
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
// 完全复用 AppSidebar 的列表间距样式
:deep(.v-list-item__spacer) {
  width: 16px !important;
}

:deep(.customImg + .v-list-item__spacer) {
  width: 10px !important;
}

.customImg {
  border-radius: var(--article-cover-radius);
}

// ============================================================
// 移动端标题字号缩放（与 AppComment 评论区标题保持一致）
// ============================================================
:deep(.v-card-title) {
  font-size: calc(1.25rem * var(--related-scale)) !important;
}
</style>
