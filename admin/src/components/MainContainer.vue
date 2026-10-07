<template>
    <el-card class="box-card">
       <template #header>
         <div class="card-header">
           <span>{{title}}</span>
           <slot name="right"></slot>
         </div>
       </template>
       <!-- 展开的内容部分 -->
      <!-- 后台管理项目中，这里通常会放表格、表单子类的数据 -->
      <slot></slot>
     </el-card>
   </template>

<script setup>
defineProps(['title'])
</script>

<style scoped lang="scss">
.box-card {
  min-height: 100%;
  box-sizing: border-box;
}
.card-header {
  display: flex;
  justify-content: space-between;
  // align-items: center;

}
</style>