<template>
    <offlineIcon icon="ep:check"></offlineIcon>
    <onlineIcon icon="ep:filter"></onlineIcon>
  
    <!-- <el-button>Default</el-button> -->
    <el-button   type="primary" icon="Edit"  circle plain/>
    <el-button icon="Plus" type="primary">sds </el-button>

  <SvgIcon name="5" fill="blue"></SvgIcon>
  <SvgIcon name="7" fill="red"></SvgIcon>

  <IconFont icon="demo-renzheng" style="color: red;"></IconFont>
  <IconFont icon="demo-fenxiang"></IconFont>
  <IconFont icon="e602" uni style="color: yellow;"></IconFont>
  <IconFont icon="icon-xiangyou" svg fill="red"></IconFont>
  <IconFont icon="icon-xiangxia" svg ></IconFont>

</template>

<script setup>
import { IconFont, SingleIcon } from '@/components/MyIcon';
import offlineIcon from '@/components/MyIcon/src/offlineIcon';
import onlineIcon from '@/components/MyIcon/src/onlineIcon';
import SvgIcon from '@/components/MyIcon/src/SvgIcon.vue';

</script>

<style scoped lang="scss">
.iconfont {
  color: blue;
}
</style>