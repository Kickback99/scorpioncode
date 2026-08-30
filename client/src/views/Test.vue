<template>
  <div class="pa-4">
    
    <!-- 1. 文字颜色变体 -->
    <div class="text-primary">主要颜色（原始）</div>
    <div class="text-primary-lighten-1">主要颜色 - 亮色变体1</div>
    <div class="text-primary-lighten-2">主要颜色 - 亮色变体2</div>
    <div class="text-primary-darken-1">主要颜色 - 深色变体1</div>
    <div class="text-primary-darken-2">主要颜色 - 深色变体2</div>

    <v-divider class="my-4"></v-divider>

    <!-- 2. 背景颜色变体 -->
    <div class="bg-secondary pa-3 mb-2">次要颜色背景（原始）</div>
    <div class="bg-secondary-lighten-1 pa-3 mb-2">次要颜色背景 - 亮色变体1</div>
    <div class="bg-secondary-lighten-2 pa-3 mb-2">次要颜色背景 - 亮色变体2</div>
    <div class="bg-secondary-darken-1 pa-3 mb-2">次要颜色背景 - 深色变体1</div>
    <div class="bg-secondary-darken-2 pa-3 mb-2">次要颜色背景 - 深色变体2</div>

    <v-divider class="my-4"></v-divider>

    <!-- 3. 边框颜色变体 -->
    <div class="border-primary pa-3 mb-2 border-solid">主要颜色边框</div>
    <div class="border-primary-lighten-1 pa-3 mb-2 border-solid">主要颜色边框 - 亮色1</div>
    <div class="border-primary-darken-2 pa-3 mb-2 border-solid">主要颜色边框 - 深色2</div>

    <v-divider class="my-4"></v-divider>

    <!-- 4. 自定义颜色的变体 -->
    <div class="text-customBlue">自定义蓝色（原始）</div>
    <div class="text-customBlue-lighten-1">自定义蓝色 - 亮色变体1</div>
    <div class="text-customBlue-darken-2">自定义蓝色 - 深色变体2</div>

    <v-divider class="my-4"></v-divider>

    <!-- 5. 在 Vuetify 组件中使用 -->
    <v-btn color="primary-darken-1" class="mr-2">
      深色主题按钮
    </v-btn>
    
    <v-btn color="primary-lighten-2" variant="tonal">
      浅色主题按钮
    </v-btn>

    <v-card class="mt-4" color="secondary-lighten-1">
      <v-card-text>
        这是一个使用了颜色变体的卡片
      </v-card-text>
    </v-card>

  </div>
</template>

<script setup>
// 不需要额外代码，配置后自动生效
</script>

<style scoped>
/* 辅助样式，让边框可见 */
.border-solid {
  border-width: 2px;
  border-style: solid;
}
</style>