<script setup>
import { IconJson } from "@/components/MyIcon/data";
import { cloneDeep, isAllEmpty } from "@pureadmin/utils";
import { ref, computed, watch } from "vue";

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
const pageSize = ref(35);
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
  // console.log(currentActiveType.value)
  return copyIconList[currentActiveType.value]
    .filter(i => i.includes(filterValue.value))
    .slice(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    )
}
)

// 选中的图标样式
const iconItemStyle = computed(() => {
  return item => {
    if (inputValue.value === currentActiveType.value + item) {
      return {
        borderColor: "var(--el-color-primary)",
        color: "var(--el-color-primary)"
      };
    }
  };
});


const tabNames = tabsList.map(item => {
  return item.name
})

// 把inputValue.value的值赋值给currentActiveType.value和icon.value
function setVal() {
  if(startsWithAnyPrefix(inputValue.value,tabNames)){
    // 提取:号之前的字符串
    currentActiveType.value = inputValue.value.substring(
        0,
        inputValue.value.indexOf(":") + 1
      );
        // 提取:号之后的字符串
      icon.value = inputValue.value.substring(inputValue.value.indexOf(":") + 1);
      }
}

/**
 * 检查输入字符串是否以指定的前缀数组中的任何一个开始
 * @param {string} input - 用户输入的字符串
 * @param {string[]} prefixes - 前缀数组
 * @returns {boolean} 如果输入字符串以任何一个前缀开始，则返回 true，否则返回 false
 */
 function startsWithAnyPrefix(input, prefixes) {
  return prefixes.some(prefix => input.startsWith(prefix));
}

// popover弹出层显示之前调用，回显图标所在的当前页
function onBeforeEnter() {
  if (isAllEmpty(icon.value)) return;
  setVal();
  // 寻找当前图标在第几页
  const curIconIndex = copyIconList[currentActiveType.value].findIndex(
    i => i === icon.value
  );
  currentPage.value = Math.ceil((curIconIndex + 1) / pageSize.value);
}

// popover弹出层隐藏之后调用，清除过滤条件
function onAfterLeave() {
  filterValue.value = "";
}

// 点击标签页触发事件
function handleClick({ props }) {
  currentPage.value = 1;
  currentActiveType.value = props.name;
}

// 点击icon触发事件
function onChangeIcon(item) {
  icon.value = item;
  inputValue.value = currentActiveType.value + item;
}

// 页数变化事件
function onCurrentChange(page) {
  currentPage.value = page;
}

function onClear() {
  icon.value = "";
  inputValue.value = "";
}

// 向外部暴露一个removeIcon，用于删除icon.value的值
const removeIcon = () => {
  // console.log('删除icon中')
  icon.value = ''
}

defineExpose({
  removeIcon
})



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
// 当 inputValue.value 发生变化时，如果新的值val为真，则调用setVal()函数
watch(
  () => inputValue.value,
  val => val && setVal(),
    // 在监听开始时立即执行一次回调
  { immediate: true }
);
// 当 filterValue.value 发生变化时，将当前页重置为第一页
watch(
  () => filterValue.value,
  () => (currentPage.value = 1)
);

// 添加对 inputValue 的监听，确保内部状态与外部同步
watch(
  () => inputValue.value,
  (newVal) => {
    if (!newVal) {
      icon.value = ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="selector">
    <el-input v-model="inputValue" disabled>
      <!-- 将内容插入到输入框的尾部 -->
      <template #append>
        <el-popover
          :width="350"
          trigger="click"
          popper-class="pure-popper"
          :popper-options="{
            placement: 'right'
          }"
          @before-enter="onBeforeEnter"
          @after-leave="onAfterLeave"
        >
        <!-- 弹出层触发器 -->
          <template #reference> 
            <div
              class="w-[40px] h-[32px] cursor-pointer flex justify-center items-center"
            >
            <!-- 如果icon数据属性不存在，则显示一个离线图标 -->
              <SingleIcon v-if="!icon" :icon=search />
            <!-- 如果icon数据属性存在，则显示一个在线图标 -->
              <OnlineIcon v-else :icon="inputValue" :isCollect="false"/>
            </div>
          </template>

          <el-input
            v-model="filterValue"
            class="px-2 pt-2"
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
              <el-scrollbar height="220px">
                <!-- t_question: li标签 tailwind-->
                <ul class="flex flex-wrap px-2 ml-2">
                  <li
                    v-for="(item, key) in pageList"
                    :key="key"
                    :title="item"
                    class="icon-item p-2 cursor-pointer mr-1 mt-1 flex justify-center items-center border border-[#e5e7eb]"
                    :style="iconItemStyle(item)"
                    @click="onChangeIcon(item)"
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

          <div
            class="w-full h-9 flex items-center overflow-auto border-t border-[#e5e7eb]"
          >
          <!-- 分页 -->
            <el-pagination
              class="flex-auto ml-2 overflow-hidden"
              :total="totalPage"
              :current-page="currentPage"
              :page-size="pageSize"
              :pager-count="5"
              layout="pager"
              background
              size="small"
              @current-change="onCurrentChange"
            />
            <el-button
              class="justify-end mr-2 ml-2"
              type="danger"
              size="small"
              text
              bg
              @click="onClear"
            >
              清空
            </el-button>
          </div>
        </el-popover>
      </template>
    </el-input>
  </div>
</template>

<style lang="scss" scoped>
.selector {
    width: 200px;
    overflow: hidden !important;
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
  box-shadow: 0 2px 5px rgb(0 0 0 / 6%);
}

:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
}

:deep(.el-tabs__content) {
  margin-top: 4px;
}
</style>
