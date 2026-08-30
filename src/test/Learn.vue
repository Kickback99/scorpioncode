<template>
 <!--收集Edit -->
<el-button   color="#000" style="color:red" type="primary" icon="Edit"  circle plain/>
 <!--收集Plus -->
 <el-button icon="Plus" type="primary">sds </el-button>
 <!--注释掉了，不收集 -->
 <!--<el-button icon="Upload" type="primary">sds </el-button>-->
 
 <!--这里有2个icon，收集Setting和Delete-->
    <el-popconfirm :title="`你确定要删除吗`" @confirm="handleRemove(row.id)" width="250px"
        icon="Setting" icon-color="red">
        <template #reference>
            <el-button type="danger" icon="Delete" circle plain />
        </template>
    </el-popconfirm>
 <!--收集ArrowDown-->
      <li @click="handleContextMenu('closeRight')">
        <el-icon><ArrowDown /></el-icon>
        关闭右侧标签页
      </li>

 <!--Edit重复了，不收集-->
           <el-button type="primary" :icon="Edit" circle />
 
 <!--收集CircleClose -->
        <el-icon style="margin-right: 10px;" @click="stringStore.isCollapse = !stringStore.isCollapse">
            <component is='CircleClose'></component>
        </el-icon>

 <!--收集User-->
       <el-icon style="color:red">
          <User></User>
      </el-icon>

  <!--收集Top和Bottom-->
      <el-icon style="margin-right: 10px;color:#ff0" @click="stringStore.isCollapse = !stringStore.isCollapse">
          <component :is="1+1==2?'Top':'Bottom'" color="red" style="color:black"></component>
      </el-icon>
  <!--重复-->
      <!-- <el-icon style="color:red">
          <User />
      </el-icon> -->
         
<!--收集Moon和Sunny-->
      <el-switch  v-model="dark" @change="toggleDark" size="small" inline-prompt active-icon="Moon" inactive-icon="Sunny"     style="--el-switch-on-color: #000; --el-switch-off-color: #f00"/>	
 
  <!--收集Check-->
       <el-form-item label="呢称" prop="nickname">	
                <el-input prefix-icon="Check" placeholder="请输入呢称" v-model="formData.nickname" />
       </el-form-item>
       
</template>

<script setup>
import { IconFont, SingleIcon } from '@/components/MyIcon';
import offlineIcon from '@/components/MyIcon/src/offlineIcon';
import SvgIcon from '@/components/MyIcon/src/SvgIcon.vue';
import { ref } from 'vue';

const formData = ref({})

const dark = ref(false)
const toggleDark = () => {

}
</script>

<style scoped lang="scss">

</style>