<template>
  <!-- ===== 文章卡片骨架屏 ===== -->
  <v-card class="article-skeleton">
    <v-list-item class="pa-0">
      <template v-slot:prepend>
        <div class="skeleton-cover-wrap">
          <v-skeleton-loader
            type="image"
            :width="coverWidth"
            :height="display.smAndDown.value ? undefined : coverHeight"
            class="skeleton-cover"
          />
        </div>
      </template>

      <v-list-item-title class="skeleton-title-row">
        <div class="skeleton-title-area">
          <!-- 骨行数见 titleType：xs 固定 2 行、sm 固定 1 行，md+ 跟 titleBones 旋钮 -->
          <v-skeleton-loader :type="titleType" class="skeleton-title" />
        </div>
        <!-- xs：AppArticleItem 隐藏分类 chip -->
        <v-skeleton-loader v-if="!display.xs.value" type="chip" class="skeleton-chip" />
      </v-list-item-title>

      <!-- sm+: 2-line description（对齐 AppArticleItem 简介的 line-clamp: 2） -->
      <v-list-item-subtitle v-if="display.smAndUp.value" class="skeleton-desc">
        <v-skeleton-loader type="text@2" />
      </v-list-item-subtitle>

      <!-- 元信息行 -->
      <v-list-item-subtitle class="skeleton-meta pb-1">
        <v-skeleton-loader type="subtitle" />
      </v-list-item-subtitle>
    </v-list-item>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@/store/config'

// ============================================================
// 数据
// ============================================================
const display = useDisplay()
const configStore = useConfigStore()

// 标题骨行数：走配置项 article_list.title_bone_count（1 = 单行标题骨，默认；2 = 双行标题骨）。只管 md+，xs/sm 跟真卡片走
// 押 1 行与「单行标题」的卡逐像素对齐，押 2 行与「双行标题」的卡对齐，按站点标题实际长短选
const titleBones = computed(() => configStore.titleBoneCount)

// ============================================================
// 计算属性
// ============================================================
const coverWidth = computed(() => (display.xs.value ? 110 : display.smAndDown.value ? 150 : 235))
const coverHeight = computed(() => (coverWidth.value * 9) / 16)

// xs 标题盒被真卡片定死 2 行、sm 单行截断，这两档不跟旋钮
const titleType = computed(() => {
  if (display.xs.value) return 'heading, heading'
  if (display.sm.value) return 'heading'
  return titleBones.value === 2 ? 'heading, heading' : 'heading'
})
</script>

<style scoped lang="scss">
// ============================================================
// 容器与 AppArticleItem 对齐
// ============================================================
.skeleton-cover-wrap {
  margin: 0 20px 0 12px;
}

// 圆角必须落在骨块上：Vuetify 的 `.v-skeleton-loader__image` 自带 border-radius: 0，
// 与 `.v-skeleton-loader__bone` 的 inherit 同优先级、靠源码顺序压制，根节点上的圆角传不下来
.skeleton-cover :deep(.v-skeleton-loader__image) {
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
  /* Vuetify 默认 overflow: hidden 会切掉高出内容区顶边 0.5px 的 chip 骨（同 AppArticleItem 的写法）；
     横向仍 clip 住元信息骨溢出 */
  overflow-x: clip;
  overflow-y: visible;
}

// ============================================================
// 骨块外边距清零
// ============================================================
// Vuetify 骨块默认 margin: 16px，一张卡片白吃 ~128px 空隙，这里压到最小
.article-skeleton {
  :deep(.v-skeleton-loader__image) {
    margin: 0;
    height: 100%; // 撑满 props 传入的显式高度
  }

  :deep(.v-skeleton-loader__heading) {
    margin: 0; /* 行间距交给 row-gap */
    height: calc(var(--article-title-fs) + 2px); /* 骨高 = 字号 + 加厚量（xs +2、≥600px 见下） */
  }

  :deep(.v-skeleton-loader__text) {
    margin: 1px 0;
  }

  :deep(.v-skeleton-loader__chip) {
    margin: 0;
  }
}

// ============================================================
// 标题行
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

// 保证骨架撑满标题区
// 骨高 = 字号 + 加厚量、骨距 = 上留白 = 行高 − 字号 − 加厚量、下留白 0：两行骨合计仍等于真卡片标题盒高
// （不能给 .skeleton-title 加 flex-direction——骨自带 flex 1 1 100%，竖排会被压成 0 高）
.skeleton-title {
  width: 100%;
  row-gap: calc(var(--article-title-lh) - var(--article-title-fs) - 2px);
  padding: calc(var(--article-title-lh) - var(--article-title-fs) - 2px) 0 0;
  /* 墨迹顶比行盒中心高 0.5px（Inter 升部比中文字形高 1px）：整块上移，骨才贴住墨迹 */
  position: relative;
  top: -0.5px;
}

/* sm 及以上（≥600px）：加厚量 2 → 4px（骨 18 → 22），与简介骨（14px）、日期骨（16px）拉开层次；
   xs 行距只有 4px，加到 2px 到顶，再厚两行骨会粘在一起 */
@media (min-width: 600px) {
  .skeleton-title {
    row-gap: calc(var(--article-title-lh) - var(--article-title-fs) - 4px);
    padding: calc(var(--article-title-lh) - var(--article-title-fs) - 4px) 0 0;
  }

  .article-skeleton :deep(.v-skeleton-loader__heading) {
    height: calc(var(--article-title-fs) + 4px);
  }
}

// 第二根标题骨（xs 固定 2 行、md+ 旋钮设为 2 时才有）收窄到 75%
.skeleton-title :deep(.v-skeleton-loader__heading:nth-child(2)) {
  max-width: 75%;
}

// chip 骨：与标题骨同为 22px 且顶底齐平（真 chip 是 26px，矮 4px 是刻意的视觉取舍）。
// 只管 sm 档：Vuetify 默认骨是 32px 高 / 0 宽，会把整行撑到 32px 且把分类占位藏没
.skeleton-chip {
  width: 44px;
  /* 比真卡片 .category 的 1.2px 多 2.3px —— 骨块与标题骨同高，加这 2.3px 两块顶边才齐平 */
  margin-top: 3.5px;
  margin-right: 8px; /* 对应模板的 mr-2，漏了比真 chip 靠右 8px */
  /* 骨矮到 22px 后撑不住整行（27.2 塌成 26），sm 档卡高会比真卡少 1.2px 造成加载跳动；
     垫 1.7px 补回 27.2 = 真 chip 的 1.2px 外边距 + 26px 高 */
  padding-bottom: 1.7px;

  :deep(.v-skeleton-loader__chip) {
    width: 100%;
    height: 22px;
    /* 镜像真卡片 label chip 的 8px 圆角：默认继承 16px 会被钳成整颗胶囊，顶上多圆一截 */
    border-radius: 8px;
  }
}

// sm 及以上（≥600px）：宽度取真卡片 chip 的实测值 46.21（取整 46）。骨高不再分档覆盖，恒为
// 22px —— 比真 chip 的 26px 矮，是刻意的视觉取舍，加载完成时分类块会由 22 长到 26
@media (min-width: 600px) {
  .skeleton-chip {
    width: 46px;
  }
}

// ============================================================
// 简介块（对齐 AppArticleItem 的 .description margin-top: 3px）
// ============================================================
.skeleton-desc {
  margin-top: 3px;

  /* 骨高 = 字号（14px，与标题骨同规则）：上下留白各（行高 − 14） / 2，骨顶因此落在真实墨迹顶
     （14px 档墨迹顶距行盒顶 = (行高 − 16) / 2 + 1 = (行高 − 14) / 2），2 行合计 44px = 真简介块高 */
  :deep(.v-skeleton-loader__text) {
    height: 14px;
    margin: calc((var(--article-desc-lh) - 14px) / 2) 0;
  }
}

// ============================================================
// 元信息块（对齐 AppArticleItem 的 .metadata padding-top: 8px）
// ============================================================
.skeleton-meta {
  padding-top: 8px;
  /* 覆盖模板上 .pb-1 的 4px：骨底要贴住盒底（= 封面底），与 AppArticleItem 的 .metadata 一致 */
  padding-bottom: 0 !important;
  margin-top: auto;

  /* 骨高取真卡片日期行的高度 17.5px（= mdi 图标撑起的行盒）：盒高因此是 8 + 17.5 = 25.5，
     与真卡片 .metadata 相等。sm 档卡片是内容驱动，这一项直接决定卡片高，对不上加载完会跳 */
  :deep(.v-skeleton-loader__subtitle) {
    height: 17.5px;
  }
}

// ============================================================
// 上下内边距对齐 AppArticleItem 的 list-item
// ============================================================
:deep(.v-list-item) {
  padding-bottom: 10px !important;
  padding-top: 10px !important;
}

// ============================================================
// xs / sm（<960px）：图片高度跟随文字栏
// ============================================================
// AppArticleItem 在 <960px 下图片去掉宽高比并拉伸到与文字栏等高，骨架同款
@media (max-width: 959.98px) {
  // 图片占位块跟随文字栏高度拉伸（AppArticleItem 同款 align-self: stretch）
  :deep(.v-list-item__prepend) {
    align-self: stretch;
  }

  .skeleton-cover-wrap,
  .skeleton-cover {
    height: 100%;
  }
}

// ============================================================
// xs（<600px）：对齐 AppArticleItem 的恒高适配
// ============================================================
// AppArticleItem 在 xs 下标题预留 2 行（图片拉伸见上）
@media (max-width: 599.98px) {
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
