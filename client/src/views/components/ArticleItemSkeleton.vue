<template>
  <v-card class="article-skeleton">
    <v-list-item class="pa-0">
      <template v-slot:prepend>
        <div class="skeleton-cover-wrap">
          <v-skeleton-loader
            type="image"
            :width="coverWidth"
            :height="display.xs.value ? undefined : coverHeight"
            class="skeleton-cover"
          />
        </div>
      </template>

      <v-list-item-title class="skeleton-title-row">
        <div class="skeleton-title-area">
          <!-- xs / md+：2 行标题（xs 下 ArticleItem 预留 2 行以保证卡片恒高） -->
          <v-skeleton-loader
            v-if="!display.sm.value"
            type="heading, heading"
            class="skeleton-title"
          />
          <!-- sm：1 行标题 -->
          <v-skeleton-loader
            v-else
            type="heading"
            class="skeleton-title"
          />
        </div>
        <!-- xs：ArticleItem 隐藏分类 chip -->
        <v-skeleton-loader v-if="!display.xs.value" type="chip" class="skeleton-chip" />
      </v-list-item-title>

      <!-- PC: 2-line description -->
      <v-list-item-subtitle v-if="display.mdAndUp.value" class="skeleton-desc">
        <v-skeleton-loader type="sentences" />
      </v-list-item-subtitle>

      <!-- Metadata row -->
      <v-list-item-subtitle class="skeleton-meta pb-1">
        <v-skeleton-loader type="subtitle" />
      </v-list-item-subtitle>
    </v-list-item>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const coverWidth = computed(() => (display.xs.value ? 110 : display.smAndDown.value ? 150 : 250))
const coverHeight = computed(() => (coverWidth.value * 9) / 16)
</script>

<style scoped lang="scss">
// == Container matching ArticleItem ==
.skeleton-cover-wrap {
  margin: 0 20px 0 12px;
}

.skeleton-cover {
  border-radius: var(--article-cover-radius);
}

// == Aggressive bone margin reset ==
// Vuetify default: all bone types have margin: 16px. This inflates the card
// by ~128px of wasted space. We reset to minimal values.
.article-skeleton {
  :deep(.v-skeleton-loader__image) {
    margin: 0;
    height: 100%; // fill explicit height from props
  }

  :deep(.v-skeleton-loader__heading) {
    margin: 0; /* 行间距统一交给各断点的 row-gap / 骨高控制，见文件末尾 */
  }

  :deep(.v-skeleton-loader__text) {
    margin: 1px 0;
  }

  :deep(.v-skeleton-loader__chip) {
    margin: 0;
  }
}

// == Title row ==
.skeleton-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.skeleton-title-area {
  flex: 1;
  min-width: 0;
}

// Ensure skeleton loader fills title area
.skeleton-title {
  width: 100%;
}

// Only the second heading bone (PC 2-line title) constrained to 75%
.skeleton-title :deep(.v-skeleton-loader__heading:nth-child(2)) {
  max-width: 75%;
}

// == Description (matches ArticleItem .description { margin-top: 10px }) ==
.skeleton-desc {
  margin-top: 10px;
}

// == Metadata (matches ArticleItem .metadata { padding-top: 4px }) ==
.skeleton-meta {
  padding-top: 4px;
  margin-top: auto;
}

// == Match ArticleItem list-item vertical padding ==
:deep(.v-list-item) {
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}

// == xs（<600px）：对齐 ArticleItem 的恒高适配 ==
// ArticleItem 在 xs 下标题预留 2 行、图片去掉宽高比并拉伸到与文字栏等高
@media (max-width: 599.98px) {
  // 图片占位块跟随文字栏高度拉伸（ArticleItem 同款 align-self: stretch）
  :deep(.v-list-item__prepend) {
    align-self: stretch;
  }

  .skeleton-cover-wrap,
  .skeleton-cover {
    height: 100%;
  }

  // 标题骨对齐真实标题的字形节奏：真实标题是 14px 字形 + 4.5px 字形间隙 = 18.5px 一行，
  // 故骨高取 14px、骨间距取 4.5px，首个骨下移 2.5px 对应字形上留白，
  // 合计 2.5 + 14 + 4.5 + 14 = 35px = ArticleItem 的标题区高度
  // 注意：不能改 .skeleton-title 的 flex-direction——骨自带 flex: 1 1 100%，
  // 竖排时 flex-basis 会按容器高度算成 0；它本来就是 flex-wrap 换行布局，用 row-gap 即可
  .skeleton-title {
    row-gap: 4.5px;
    padding-top: 2.5px;
  }

  .article-skeleton :deep(.v-skeleton-loader__heading) {
    height: 14px;
    margin: 0;
  }

  // 日期行占位与 ArticleItem 的 .metadata 完全对齐：盒高 32px、内边距上 12 下 0。
  // 骨高取 20px（= 真实日期行的行盒：图标 20px 撑满），骨底因此贴着盒底
  .skeleton-meta {
    height: 32px;
    padding-top: 12px;
    padding-bottom: 0 !important; /* 覆盖 Vuetify .pb-1 的 !important */
  }

  .skeleton-meta :deep(.v-skeleton-loader__subtitle) {
    height: 20px;
  }
}

// == sm 及以上（≥600px）：标题骨对齐真实标题的字形节奏 ==
// 真实标题是 16px 字形、24px 行高：骨高取 16px（= 字形高），上下各留 4px 行内留白。
// sm 只有一行（row-gap 不生效）合计 24px；md 及以上两行加 8px 间距合计 48px
@media (min-width: 600px) {
  .skeleton-title {
    row-gap: 8px;
    padding: 4px 0;
  }

  .article-skeleton :deep(.v-skeleton-loader__heading) {
    height: 16px;
  }
}
</style>
