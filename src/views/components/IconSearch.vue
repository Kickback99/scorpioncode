<template>
  <div class="selector">
          <el-input
            v-model="filterValue"
            placeholder="搜索图标"
            clearable
          />
          <!-- tabs标签页 -->
          <el-tabs v-model="currentActiveType" @tab-click="handleClick">
            <el-tab-pane
              v-for="(pane, index) in tabsList"
              :key="index"
              :label="pane.label"
              :name="pane.name"
            >
              <el-scrollbar class="icon-scrollbar">
                <!-- t_question: li标签 tailwind-->
                <ul class="flex flex-wrap px-2 ml-2">
                  <li
                    v-for="(item, key) in pageList"
                    :key="key"
                    :title="currentActiveType+item"
                    class="icon-item p-2 cursor-pointer mr-1 mt-1 flex justify-center items-center border border-[#e5e7eb]"
                    @click="copyIconName(item)"
                  >
                    <OnlineIcon
                      :icon="currentActiveType + item"
                      width="20px"
                      height="20px"
                      :isCollect="false"
                    />
                  </li>
                </ul>
                <el-empty
                  v-show="pageList.length === 0"
                  :description="`${filterValue} 图标不存在`"
                  :image-size="60"
                />
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
          <!-- 分页 -->
            <div class="pagination-container">
            <el-pagination
              :total="totalPage"
              :current-page="currentPage"
              :page-size="pageSize"
              :pager-count="5"
              layout="prev, pager, next"
              background
              small
              @current-change="onCurrentChange"
            />
            </div>
  </div>
</template>


<script setup>
import { IconJson } from "@/components/MyIcon/data";
import { cloneDeep, isAllEmpty } from "@pureadmin/utils";
import { ref, computed, watch } from "vue";
import msg from '@/components/msg'

const search = {
  "width": 1024,
  "height": 1024,
  "body": "<path fill=\"currentColor\" d=\"m795.904 750.72l124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704a352 352 0 0 0 0 704\"/>"
}

defineOptions({
  name: "IconSelect"
});

const inputValue = defineModel({ type: String });

const iconList = ref(IconJson);
const icon = ref();
const currentActiveType = ref("ep:");
// 深拷贝图标数据，前端做搜索
const copyIconList = cloneDeep(iconList.value);
const totalPage = ref(0);
// 每页显示35个图标
const pageSize = ref(33);
const currentPage = ref(1);

// 搜索条件
const filterValue = ref("");

// tabs数据
const tabsList = [
  {
    label: "Element Plus",
    name: "ep:"
  },
  {
    label: "Remix Icon",
    name: "ri:"
  },
  {
    label: "Font Awesome 5 Solid",
    name: "fa-solid:"
  }
/*   {
    label: "Ant Design Icons",
    name: "ant-design:"
  } */
];

// 提取当前页显示的元素列表
  /* 
    算法如下：
      第1页(提取0-35)
      0
      35
      第2页(提取35-70)
      35
      70
      第3页(提取70-105)
      70
      105 
  */
const pageList = computed(() =>{
  console.log(currentActiveType.value)
  return copyIconList[currentActiveType.value]
    .filter(i => i.includes(filterValue.value))
    .slice(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    )
}
)

// 点击标签页触发事件
function handleClick({ props }) {
  currentPage.value = 1;
  currentActiveType.value = props.name;
}

// 复制图标名称到剪贴板
async function copyIconName(icon) {
  try {
    const iconName = typeof icon === 'string' ? icon : JSON.stringify(icon)
    const finalIconName = currentActiveType.value + iconName
    await navigator.clipboard.writeText(finalIconName)
    msg.primary('图标已复制')
  } catch (err) {
    console.error('复制失败:', err)
    msg.error('复制失败')
  }
}

// 页数变化事件
function onCurrentChange(page) {
  currentPage.value = page;
}



// 当 pageList.value 发生变化时，重新计算 totalPage.value的值，totalPage.value的值根据过滤的元素决定
watch(
  () => pageList.value,
  () =>
    (totalPage.value = copyIconList[currentActiveType.value].filter(i =>
      i.includes(filterValue.value)
    ).length),
    // 在监听开始时立即执行一次回调
  { immediate: true }
);
// 当 filterValue.value 发生变化时，将当前页重置为第一页
watch(
  () => filterValue.value,
  () => (currentPage.value = 1)
);
</script>



<style lang="scss" scoped>
.selector {
    width: 500px;
    margin: auto;
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
    gap: 8px; /* 减少间距 */
}

// tabs内容区的总高度
.icon-scrollbar {
    height: 140px;
}


.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  margin-top: 4px; /* 减少上边距 */
}

/* 保持与Select.vue一致的标签页样式 */
:deep(.el-tabs__nav-next),
:deep(.el-tabs__nav-prev) {
  font-size: 15px;
  line-height: 32px;
}

:deep(.el-tabs__nav-next) {
  box-shadow: -5px 0 5px -6px #ccc;
}

:deep(.el-tabs__nav-prev) {
  box-shadow: 5px 0 5px -6px #ccc;
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

:deep(.el-tabs__nav-next) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: -5px 0 5px -6px #ccc;
}

:deep(.el-tabs__nav-prev) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: 5px 0 5px -6px #ccc;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-tabs__item) {
  height: 30px;
  font-size: 12px;
  font-weight: normal;
  line-height: 30px;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap) {
  position: static;
  margin: 0;
  // box-shadow: 0 2px 5px rgb(0 0 0 / 6%);
}

:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 10px;
}

/* :deep(.el-tabs__content) {
  margin-top: 4px;
} */
</style>
