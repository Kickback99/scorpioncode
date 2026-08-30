<template>
        <!--多级菜单-->
            <template v-for="menu in listData">
            <el-menu-item :index="handleChildren(menu)" v-if="handleMenuVisible(menu)">
                <el-icon><SingleIcon :icon="menu.meta.icon"></SingleIcon></el-icon> <span>{{menu.meta.title}}</span>
            </el-menu-item>

            <el-sub-menu :index="`/system/${menu.path}`" v-else-if="menu.hidden ===false">
            <template #title>
                <el-icon><SingleIcon :icon="menu.meta.icon"></SingleIcon></el-icon> <span>{{ menu.meta.title }}</span>
            </template>
            <!--展开的每一个菜单项-->
                <menu-tree :listData="menu.children"></menu-tree>
            </el-sub-menu>
        </template>

</template>

<script setup>
defineProps(['listData'])

const handleMenuVisible = (menu) => {
    if((menu.children == null || menu.children.length == 0) && menu.hidden === false){
        return true
    }
}

const handleChildren = (menu) => {
    // 根据 type 来决定添加哪个前缀
    // const prefix = menu.type === 'system'?'system':'content'
    let prefix;
    switch(menu.type){
        case 'system':
            prefix = 'system'
            break
        case 'content':
            prefix = 'content'
            break
        case 'msg':
            prefix = 'msg'
            break
        case 'monitor':
            prefix = 'monitor'
            break
        case 'resource':
            prefix = 'resource'
            break
        case 'config':
            prefix = 'config'
            break
        case 'task':
            prefix = 'task'
            break
        case 'write':
            prefix = 'write'
            break
    }
    // 判断是否是配置管理类菜单（component为list且通过parentNode添加的）
    if(menu._addToParentNode){
        // 配置管理菜单，直接返回 /config 路径
        return `/${prefix}`
    }
    
     // 处理有 level 标记的二级菜单（如日志管理下的子菜单）
    if(menu.level) {
        // 如果路径中包含 log，则添加 log 父路径
        return `/${prefix}/${menu.parentPath}/${menu.path}`
    }
    
    // 普通菜单
    return `/${prefix}/${menu.path}`
    // return menu.path.includes('Log') === true ? `/system/log/${menu.path}`:`/system/${menu.path}`
 }

</script>

<style scoped lang="scss">
  /* .el-menu-item,.el-sub-menu__title span,i{
    color:$menu-color;
  } */

</style>