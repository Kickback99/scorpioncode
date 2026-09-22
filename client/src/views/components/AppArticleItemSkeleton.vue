<template>
  <!-- ===== 文章卡片骨架屏 ===== -->
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
          <!-- xs / md+：2 行标题（xs 下 AppArticleItem 预留 2 行以保证卡片恒高） -->
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
        <!-- xs：AppArticleItem 隐藏分类 chip -->
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

// ============================================================
// 数据
// ============================================================
const display = useDisplay()

// ============================================================
// 计算属性
// ============================================================
const coverWidth = computed(() => (display.xs.value ? 110 : display.smAndDown.value ? 150 : 250))
const coverHeight = computed(() => (coverWidth.value * 9) / 16)
</script>

<style scoped lang="scss">
// ============================================================
// Container matching AppArticleItem
// ============================================================
.skeleton-cover-wrap {
  margin: 0 20px 0 12px;
}

.skeleton-cover {
  border-radius: var(--article-cover-radius);
}

// ============================================================
// 文字栏：与 AppArticleItem 一样拉伸到行高
// ============================================================
// .v-list-item 是 grid + align-items: center，文字栏默认居中（不拉伸）：真卡片靠
// align-self: stretch 撑满、日期行才能贴底。缺这条加载完成时文字栏会跳 13~14px
.article-skeleton :deep(.v-list-item__content) {
  display: flex;
  flex-direction: column;
  align-self: stretch !important;
}

// ============================================================
// Aggressive bone margin reset
// ============================================================
// Vuetify default: all bone types have margin: 16px. This inflates the card
// by ~128px of wasted space. We reset to minimal values.
.article-skeleton {
  :deep(.v-skeleton-loader__image) {
    margin: 0;
    height: 100%; // fill explicit height from props
  }

  :deep(.v-skeleton-loader__heading) {
    margin: 0; /* 行间距交给 row-gap */
    height: var(--article-title-fs); /* 骨高 = 字形高 = 标题字号 */
  }

  :deep(.v-skeleton-loader__text) {
    margin: 1px 0;
  }

  :deep(.v-skeleton-loader__chip) {
    margin: 0;
  }
}

// ============================================================
// Title row
// ============================================================
.skeleton-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 与 .title-category 一致：标题 2 行时 chip 骨也要贴顶 */
  gap: 16px;
  width: 100%;
  /* 跟随 .title-category 一起上移，否则加载完成时跳 2~3px */
  position: relative;
  top: calc(-1 * var(--article-title-lift));
}

.skeleton-title-area {
  flex: 1;
  min-width: 0;
}

// Ensure skeleton loader fills title area
// 骨高 = 字号、骨间距 = 行高 − 字号、上下留白各一半：两行骨合计正好等于真卡片标题盒高
// （不能给 .skeleton-title 加 flex-direction——骨自带 flex 1 1 100%，竖排会被压成 0 高）
.skeleton-title {
  width: 100%;
  row-gap: calc(var(--article-title-lh) - var(--article-title-fs));
  padding: calc((var(--article-title-lh) - var(--article-title-fs)) / 2) 0;
}

// Only the second heading bone (PC 2-line title) constrained to 75%
.skeleton-title :deep(.v-skeleton-loader__heading:nth-child(2)) {
  max-width: 75%;
}

// chip 骨：镜像真卡片的分类 chip（22px 高 + 上边距 3.2px；md+ 抬到 26px / 29.2px，见下）。
// 原来只落 Vuetify 默认尺寸（32px 高、宽 0）：高 32 把整行撑到 32px、标题骨被居中压低 3px；
// 宽 0 则分类占位在骨架屏上根本看不见。两者都只影响 sm 档 —— md 的行高由标题骨主导，chip 不参与
.skeleton-chip {
  width: 44px;
  /* 镜像真卡片 .category 的两个外边距：上 3.2px 对齐标题首行墨迹顶，
     右 8px 对应模板上的 mr-2（漏了会被顶到内容区右边界，比真 chip 靠右 8px） */
  margin-top: 3.2px;
  margin-right: 8px;

  :deep(.v-skeleton-loader__chip) {
    width: 100%;
    height: 22px;
  }
}

// sm 及以上（≥600px）：跟随真卡片 .category 一起抬到 14px/26px（宽 42.5 → 46.2，取整 46），
// 否则加载完成时分类 chip 会由 22px 跳变到 26px
@media (min-width: 600px) {
  .skeleton-chip {
    width: 46px;

    :deep(.v-skeleton-loader__chip) {
      height: 26px;
    }
  }
}

// ============================================================
// Description (matches AppArticleItem .description { margin-top: 10px })
// ============================================================
.skeleton-desc {
  margin-top: 10px;
}

// ============================================================
// Metadata (matches AppArticleItem .metadata { padding-top: 4px })
// ============================================================
.skeleton-meta {
  padding-top: 4px;
  /* 覆盖模板上 .pb-1 的 4px：骨底要贴住盒底（= 封面底），与 AppArticleItem 的 .metadata 一致 */
  padding-bottom: 0 !important;
  margin-top: auto;
}

// ============================================================
// Match AppArticleItem list-item vertical padding
// ============================================================
:deep(.v-list-item) {
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}

// ============================================================
// xs（<600px）：对齐 AppArticleItem 的恒高适配
// ============================================================
// AppArticleItem 在 xs 下标题预留 2 行、图片去掉宽高比并拉伸到与文字栏等高
@media (max-width: 599.98px) {
  // 图片占位块跟随文字栏高度拉伸（AppArticleItem 同款 align-self: stretch）
  :deep(.v-list-item__prepend) {
    align-self: stretch;
  }

  .skeleton-cover-wrap,
  .skeleton-cover {
    height: 100%;
  }

  // 日期行占位与 AppArticleItem 的 .metadata 完全对齐：盒高 32px、内边距上 12 下 0。
  // 骨高取 20px（= 真实日期行的行盒：图标 20px 撑满），骨底因此贴着盒底
  .skeleton-meta {
    height: 32px;
    padding-top: 12px;
  }

  .skeleton-meta :deep(.v-skeleton-loader__subtitle) {
    height: 20px;
  }
}

// sm 及以上（≥600px）的骨尺寸与 xs 共用同一套派生规则，无额外覆盖：
// sm 单行骨合计 = 行高 24px（真实单行标题高），md 两行加间距合计 = 48px（真实两行标题高）
</style>
