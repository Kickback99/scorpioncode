<template>
    <el-select v-model="text" placeholder="请选择用户类型" style="width: 200px">
        <el-option label="前台用户" value="1" />
        <el-option label="后台用户" value="0" />
    </el-select>
</template>

<script setup>
const text = defineModel()
</script>

<style scoped lang="scss">

</style>