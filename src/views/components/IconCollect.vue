<template>
    <!-- 隐藏的预加载容器 -->
    <div style="display: none;">
      <component 
        v-for="(item, index) in preloadedComponents" 
        :key="index"
        :is="item.component" 
      />
    </div>
    <!-- 添加 v-loading 指令的容器 -->
  <div 
    v-loading="loading" 
    element-loading-text="图标加载中..."
    :element-loading-background="userConfigStore.isDarkEnabled ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'"
    class="icons-container"
  >  

    <div class="icons-container">
        <el-input
          v-model="filterValue"
          placeholder="搜索图标"
          clearable
          @clear="onClear"
        />
        
      <div class="flex justify-between" v-if="configStore.getIconEnabled()">
        <div class="flex items-center">
          <span class="ml-2">内联图标控制</span>  <!-- 固定文本 -->
          <el-switch 
            v-model="iconStore.isExcludeInline" 
            @change="changeIconDisplay"
          />
        </div>
        
        <div class="flex items-center">
          <span class="ml-2">批量图标显示</span>  <!-- 固定文本 -->
          <el-switch 
            v-model="iconStore.showBatchUsedIcons" 
            @change="changeIconUsed" 
            :disabled="currentActiveType != 'batch'"
          />
        </div>
      </div>

      <el-tabs v-model="currentActiveType" @tab-click="handleClick">
        <el-tab-pane
          v-for="(pane, index) in filteredTabsList"
          :key="index"
          :label="pane.label"
          :name="pane.name"
        >
          <el-scrollbar class="icon-scrollbar">
            <ul class="flex flex-wrap px-2 ml-2">
              <li
                v-for="(item, key) in pageList"
                v-show="visibleInlineIcon(item)"
                :key="key"
                :title="handleTitle(item)"
                class="icon-item p-2 cursor-pointer mr-1 mt-1 flex justify-center items-center border border-[#e5e7eb]"
                style="width: 37.6px; height: 37.6px; min-width: 37.6px; min-height: 37.6px;"
                @click="copyIconName(item)"
              >
                  <OnlineIcon
                    v-if="currentActiveType === 'online'"
                    :icon="item"
                    width="20px"
                    height="20px"
                    :color="setIconColor(item)"
                  />
                  <el-icon v-else-if="currentActiveType === 'element'">
                    <component :is="item.icon" />
                  </el-icon>
                  <SvgIcon v-else-if="currentActiveType === 'svg'" 
                  :name="item.name" :color="item.color?item.color:''" />
                  <template v-else-if="currentActiveType ===  'alibaba'">
                    <IconFont v-if="item.type == 'iconfont'" :icon="item.icon" :style="{color:item.color?item.color:''}"/>
                    <IconFont v-else-if="item.type == 'uni'" :icon="item.icon" :fill="item.color?item.color:''"  uni />
                    <IconFont v-else  :icon="item.icon" :fill="item.color?item.color:''" />
                  </template>
                  <OfflineIcon 
                    v-else
                    :icon="item"
                    width="20px"
                    height="20px"
                    :isCollect="false"
                    :color="setIconColor(item)"
                  />
              </li>
            </ul>
            <el-empty
              v-show="pageList.length === 0"
              description="未找到匹配的图标"
              :image-size="60"
            />
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>

      <div class="pagination-container">
        <el-pagination
          :total="totalPage * pageSize"
          :current-page="currentPage"
          :page-size="pageSize"
          :pager-count="5"
          layout="prev, pager, next"
          background
          small
          @current-change="onCurrentChange"
        />
        <el-button
          class="clear-btn"
          type="danger"
          size="small"
          text
          bg
          @click="onClear"
        >
          清空
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIconStore } from '@/store/icon'
import { ref, computed,onMounted,nextTick } from 'vue'
import { getDynamicRouteComponents,getLocalRouteComponents } from '@/utils/RouteHandler'
import { useLoadStore } from '@/store/load'
import { analyzeComponent, getComponentImportPath} from '@/utils/hasIconComponent'
import { plainComData } from '@/data/plainComponent'
import { IconFont } from '@/components/MyIcon'
import SvgIcon from '@/components/MyIcon/src/SvgIcon.vue'
import { useUserConfigStore } from '@/store/userConfig'
import { useConfigStore } from '@/store/config'
import msg from '@/components/msg'
const configStore =  useConfigStore()

const preloadedComponents = ref([])
const loadStore = useLoadStore()
const iconStore = useIconStore()
const userConfigStore = useUserConfigStore()
// 添加 loading 状态
const loading = ref(false)
onMounted(async () => {
  loading.value = true // 开始加载
  try {
    // 获取所有路由组件 (本地 + 动态)
    const localComponents = getLocalRouteComponents(loadStore.excludeLocalComponents);
    const dynamicComponents = getDynamicRouteComponents(loadStore.excludeDynamicComponents);
    
    const allComponents = [...plainComData,...localComponents,...dynamicComponents];
    /* allComponents.forEach((item)=>{
      console.log('打印每个元素的component',item.component)
    }) */
    // console.log('All route components:', allComponents);
    
    // 初始化预加载组件数组
    preloadedComponents.value = allComponents.map(route => ({
      path: route.path,
      name: route.name,
      component: null,
      loaded: false,
      hasIcon: false,
      iconName: null
    }));
    
    // 并行加载所有组件
    const loadPromises = allComponents.map(async (route, index) => {
      if (loadStore.isComponentLoaded(route.name)) {
        console.log(`⏩ 已跳过加载: ${route.name} (已缓存)`)
        return
      }
      
      try {
        // ========== 静态分析阶段 ==========
        let hasIcon = false;
          
        const importPath = getComponentImportPath(route.component);
        if (importPath) {
          // console.log(`🔍 分析组件: ${importPath}`);
          hasIcon = await analyzeComponent(importPath);
        } else {
          // console.warn(`⚠️ 无法分析组件 ${route.name}`);
        }
        
        // ========== 组件加载阶段 ==========
        // 只有包含图标的组件才进行实际加载
        if (hasIcon) {
          // 如果是动态导入函数则执行，否则直接使用组件
          const module = typeof route.component === 'function' 
            ? await route.component() 
            : route.component;
          
          console.log('module',module)
          preloadedComponents.value[index].component = module.default || module;
          preloadedComponents.value[index].loaded = true;
          preloadedComponents.value[index].hasIcon = true;
          
          loadStore.setComponentLoaded(route.name);
          
          console.log(`✅ 已加载包含图标的组件: ${route.name}`);
        } else {
          // 不包含图标的组件，只标记为已加载但不实际加载组件
          preloadedComponents.value[index].loaded = true;
          loadStore.setComponentLoaded(route.name);
          // console.log(`⏭️  跳过加载无图标组件: ${route.name}`);
        }
      } catch (error) {
        // console.error(`❌ 处理组件 ${route.name} 失败:`, error);
      }
    });
    
    console.log('preloadedComponents', preloadedComponents.value);
    await Promise.all(loadPromises);
    // console.log("所有路由组件已处理完成");

    // 输出包含图标的组件总结
    /* const componentsWithIcons = preloadedComponents.value.filter(comp => comp.hasIcon);
    console.log('🎯 包含图标的组件:', componentsWithIcons.map(comp => ({
      name: comp.name,
      icon: comp.iconName
    }))); */


    // 所有组件加载完成后，在下一个tick中统一销毁
    if (preloadedComponents.value.some(comp => comp.loaded)) {
      nextTick(() => {
        console.log('所有组件已挂载，开始清理...')
        preloadedComponents.value = []
      })
    }
  } catch (err) {
    console.error('预加载组件失败:', err)
  } finally {
    loading.value = false // 结束加载
  }
})
/* onMounted(async () => {

  // 动态导入 Index.vue
   const module = await import("@/views/Index.vue");
  IndexComponent.value = module.default;
      await collectIconsFromSource()
  console.log("Index.vue 已加载并挂载（但隐藏）"); 
}); */

/* onMounted(async () => {
      // 添加延迟确保应用完全加载
      setTimeout(async () => {

      }, 2000)
    }) */

// 每页显示的图标数量
const pageSize = ref(33)
const currentPage = ref(1)
const currentActiveType = ref('online')
const filterValue = ref('')

// tabs数据 - 按照你提供的分类方式
const tabsList = [
  {
    label: "在线图标",
    name: "online",
    icons: () => iconStore.onlineIcons // 使用getter
  },
  {
    label: "批量图标",
    name: "batch",
    icons: () => iconStore.batchIcons
  },
    {
    label: "批量图标已使用",
    name: "batchUsed",
    icons: () => iconStore.batchUsedIcons
  },
  {
    label: "单个图标",
    name: "single",
    icons: () => iconStore.singleIcons
  },
  {
    label: "自定义图标",
    name: "custom",
    icons: () => iconStore.customIcons,
    show: () => iconStore.customIcons.length > 0
  },
  {
    label: "饿了么图标",
    name: "element",
    icons: () => iconStore.elementIcons,
    show: () => iconStore.elementIcons.length > 0
  },
  {
    label: "svg图标",
    name: "svg",
    icons: () => iconStore.svgIcons,
  },
  {
    label: "阿里巴巴图标",
    name: "alibaba",
    icons: () => iconStore.alibabaIcons,
  },
]

// 过滤后的标签页列表（不显示空分类）
const filteredTabsList = computed(() => {
  return tabsList.filter(tab => {
    // 如果当前是"批量图标已使用"标签页，且开启了增强搜索（iconEnabled === 0），则隐藏
    if (tab.name === 'batchUsed' && configStore.getIconEnabled()) {
      return false
    }
    if (tab.show) return tab.show()
    return true
  })
})

// 当前显示的图标列表
const currentIcons = computed(() => {
  const tab = tabsList.find(t => t.name === currentActiveType.value)
  if (!tab) return []
  
  return tab.icons().filter(icon => {
    if (typeof icon === 'string') {
      return icon.toLowerCase().includes(filterValue.value.toLowerCase())
    }
    return true
  })
})

// 分页后的图标列表
const pageList = computed(() => {
  return currentIcons.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

// 总页数
const totalPage = computed(() => {
  return Math.ceil(currentIcons.value.length / pageSize.value)
})

// 切换页码
function onCurrentChange(page) {
  currentPage.value = page
}

// 处理标题显示(普通函数)
/* const handleTitle = (item)=>{
  const selected = currentActiveType.value
  if(selected === 'alibaba' || selected === "element"){
      return item.icon
  }else if (selected === 'svg') {
    return item.name
  }else return item
} */

// 处理标题显示(计算属性返回一个函数)
const handleTitle = computed(() => {
  const selected = currentActiveType.value
  return (item) => {
    if(selected === 'alibaba' || selected === "element"){
      return item.icon
    } else if (selected === 'svg') {
      return item.name
    } else {
      return item
    }
  }
})

const batchArr = []

// 切换标签页
function handleClick({ props }) {
  currentPage.value = 1
  currentActiveType.value = props.name
}

// 复制图标名称到剪贴板
async function copyIconName(icon) {
  try {
    const iconName = typeof icon === 'string' ? icon : JSON.stringify(icon)
    await navigator.clipboard.writeText(iconName)
    msg.primary('图标已复制')
  } catch (err) {
    console.error('复制失败:', err)
    msg.error('复制失败')
  }
}

// 清空搜索
function onClear() {
  filterValue.value = ''
  currentPage.value = 1
}

/* const getIconColor = (icon) => {
  return iconStore.isExcludeInline && iconStore.onlineIconsGets.includes(icon) ? '#ccc' : ''
} */

const changeIconDisplay = (data) => {
  iconStore.setIsExcludeInline = data
}


const changeIconUsed = (data) => {
  iconStore.setShowBatchUsedIcons = data
}

const setIconColor = (item) => {
  return iconStore.isExcludeInline && iconStore.onlineIcons.includes(item)? '#ccc':''
}

const visibleInlineIcon = (item) => {
  if(currentActiveType.value === 'batch' && iconStore.showBatchUsedIcons){
    const iconArr = iconStore.batchUsedIcons
    console.log(iconArr)
    if(iconArr.length > 0 && iconArr.includes(item)){
      return true 
    }else return false
  }
  return true
}

</script>



<style lang="scss" scoped>
.flex.items-center {
  display: flex;
  align-items: center;
  gap: 8px; /* 控制间距 */
  span {
      font-size: 12px;
      color:#aaa;
  }
}


.icons-container {
  height: 100%;
  width: 500px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 减少间距 */
}

.search-container {
//   width: 250px;
  // padding: 0 12px;
}

// tabs内容区的总高度
.icon-scrollbar {
    height: 140px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  padding: 12px;
  margin: 0;
}
.icon-item {
  border: 1px #e5e7eb solid;
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    transition: all 0.4s;
    transform: scaleX(1.05);
  }
}


.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  margin-top: 4px; /* 减少上边距 */
}

.clear-btn {
  margin-left: 12px;
}

/* 保持与Select.vue一致的标签页样式 */
:deep(.el-tabs__nav-next),
:deep(.el-tabs__nav-prev) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: 2px 0 3px -1px rgba(0, 0, 0, 0.1); /* 减弱阴影 */
}

:deep(.el-tabs__nav-next) {
  margin-left: 30px;
  box-shadow: -5px 0 5px -6px #ccc;
  
}

:deep(.el-tabs__nav-prev) {
  box-shadow: 5px 0 5px -6px #ccc;
}

:deep(.el-tabs__item) {
  height: 30px;
  font-size: 12px;
  font-weight: normal;
  line-height: 30px;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap) {
  position: relative;
  margin: 0;
  // box-shadow: 0 2px 5px rgb(0 0 0 / 6%);
}

:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 25px;
}
</style>