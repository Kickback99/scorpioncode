<template>
  <div class="category-container">
 <!--  <div>
    <p>分类管理</p>
  </div> -->
   <!-- <h4> isEnd.value: {{ isEnd }}</h4> 
   <h4> isChildId: {{ isChildId }}</h4> 
   <h4> currentEditID {{ currentEditID }}</h4> 
   <h4> isChild: {{ isChild }}</h4> 
   <h4> isBig: {{ isBig }}</h4> 
   <h4> isParentChild: {{ isParentChild }}</h4> 
   <h4> isHasChild(有子节点吗): {{ isHasChild }}</h4> 
   <h4> isNormal(正常): {{ isNormal }}</h4> 
   <h4> isNative(原生): {{ isNative }}</h4>  -->
  <el-button size="small" type="primary" @click="addParent" v-perm="'btn.category.add'" :disabled="disabledAddParent" plain>新增</el-button>
  <el-button size="small" type="info" @click="handleReset" plain>重置</el-button>
  <!-- table树形展示 -->
  <!-- <el-table :data="cateData" :style="{ width: '100%' }" row-key="id">
        <el-table-column prop="name" label="分类名"  />
    </el-table> -->

  <!-- 树形展示 -->
  <el-tree class="tree-with-line" :class="[lineClass, cateParentClass, cateChildClass, { 'page-theme': settingStore.pageTheme }]" :style="cateParentStyle" style="max-width: 600px; margin-top: 15px;" :data="cateData" :props="defaultProps"
  show-checkbox  
  node-key="id" @check-change="handleChecked" @check="getCheck"
  :draggable="isDraggable"  :allow-drop="allowDrop" @node-drop="handleDrop"  ref="treeRef"
  :expand-on-click-node="false" @node-click="handleNodeClick" :default-expanded-keys="expandKey">
    <template #default="{ node, data }">
      <span class="custom-tree-node">
        <el-input :ref="setInputRef(data.id)" v-if="data.flag" 
        @blur="handleBlur(node, data)" v-model="category[data.id]"
        @input="handleInput(node,data)"
          :placeholder="handleComment()" size="small" @keyup.enter="confirm($event,node,data)" />
        <span v-else>{{ node.label }}</span>
        <!-- <span else>{{ node.label }}</span> -->
        <!-- 新增 -->
        <el-button size="small" type="primary" v-perm="'btn.category.add'" v-if="node.level <= 1 && allShow" @click="append(node, data)" icon="Plus" style="margin-left: 8px" circle plain />


        <!-- 批量添加按钮显示 -->
        <!-- 
            只有以下3个条件满足才显示
              只有是新增模式
              确定按钮显示
              最后一个子节点
           -->
        <el-button size="small" type="primary" v-if="handleAdd(node,data,false)" icon="Plus" @click="batchAdd(node, data)" style="margin-left: 8px" circle plain />


        <!-- 确定按钮：提交服务器 -->
        <!-- 
            如果是新增模式：
              data.isSave && isLastChild(node,data)
              确定按钮的显示，是否为最后一个子节点
            如果是编辑模式(两个条件之一满足就显示)：
              data.isSave && currentEditID === data.id
              data.isSave && isLast === data.id
              确定按钮的显示，是否是当前编辑行
           -->
        <el-button
        size="small" type="success"
        v-if="!isEdit ? handleAdd(node,data,true) :
        (data.isSave && currentEditID === data.id) ||(data.isSave && isLast === data.id) "
        :disabled="!isEdit?false:handleDisabled(data)"
        icon="Check"
        @click="handleSave($event, node, data)" style="margin-left: 8px" circle plain />


        <!-- 虚拟按钮：修改 -->

        <el-button size="small" type="warning" v-if="data.isCheck" icon="EditPen" @click="handleCheck(node,data)" style="margin-left: 8px" circle plain />

        <!-- 虚拟按钮：恢复 -->
          <!-- 
            如果是新增模式：data.isReset
            如果是编辑模式：data.isReset  && handleInclude(data.id)
          -->

        <el-button
        size="small" type="info"
        v-if="!isEdit?data.isReset:(data.isReset  && handleInclude(data.id))"
        :icon="!isEdit?'Close':'Refresh'"
        @click="handleRevert($event,node, data)" circle plain />

        <!-- 编辑 -->
        <!-- 
            如果是新增模式，则allShow
            如果是编辑模式，则isEdit和data.isEdit 
              关于data.isEdit 
               默认data.isEdit为false(这里一定要false，因为属性没有，默认是false)，如果点中的是当前编辑行则为true
               即点中哪个编辑项，哪个编辑项隐藏 
         -->
        <el-button size="small" type="warning" v-perm="'btn.category.update'" v-if="!isEdit ? allShow : (isEdit && !data.isEdit)" @click="handleEdit(node, data)" icon="Edit" style="margin-left: 8px" circle plain />
        <!-- 删除 -->
        <el-popconfirm v-if="(data.children === null || data.children.length === 0) && allShow"
          @confirm="batchRemove(node,data,true)" :title="`你确定要删除 ${data.name} 吗`" width="250px" icon="WarnTriangleFilled">
          <template #reference>
            <el-button size="small" type="danger" v-perm="'btn.category.remove'" @click.stop icon="Delete" style="margin-left: 8px" circle plain />
          </template>
        </el-popconfirm>
        <el-button size="small" type="danger" v-perm="'btn.category.remove'" v-if="checkedIds == data.id" @click.stop="batchRemove(node,data,false)" icon="Delete" style="margin-left: 8px;" circle plain />


        <!-- <el-popconfirm v-if="data.children === null || data.children.length === 0" :title="`你确定要删除${row.roleName}吗`" @confirm="removeRole(row.id)" width="250px" icon="WarnTriangleFilled">
                <template #reference>
                    <el-button :disabled="$hasPerm('btn.sysRole.remove')" type="danger" icon="Delete"  circle plain/>
                </template>
            </el-popconfirm> -->
          <!-- <el-button @click="handleTest(node,data)">test</el-button> -->
      </span>
    </template>
  </el-tree>
  <!-- <el-button>确定</el-button> -->
  </div>
</template>

<script setup>
import { addApi, listApi, modifyApi, removeApi } from '@/api/category';
import { computed, nextTick, reactive, ref, watch } from 'vue';
import msg from '@/components/msg';
import { useConfigStore } from '@/store/config';
import { useSettingStore } from '@/setting';

const configStore = useConfigStore()
const settingStore = useSettingStore()
const lineClass = computed(() => `tree-line-${configStore.getTreeCateLineStyle()}`)
const cateParentClass = computed(() => `tree-cate-parent-${configStore.getTreeCateParentMode()}`)
const cateChildClass = computed(() => `tree-cate-child-${configStore.getTreeCateChildMode()}`)
const cateParentStyle = computed(() => configStore.getTreeCateParentMode() === 'custom' ? { '--tree-cate-parent-width': configStore.getTreeCateParentWidth() + 'px' } : {})

defineOptions({
  name: 'Category'
})

const cateData = ref([])

// 全部按钮的开关
// 除了编辑按钮额外处理，其他按钮的显示隐藏都依赖这个数据
const allShow = ref(true)

//收集数据提交服务器
const treeList = ref([])

const inputRefs = ref({})

const treeRef = ref()

const isDraggable  = ref(true)

const isCheckboxDisabled = ref(false)

const disabledAddParent = ref(false)



const handleTest = (node,data) => {
  /* const flag =  node.parent.data.children.some(item => item.id === currentEditID.value)
  console.log(flag) */
  // console.log(handleComment())
  console.log(node)
  console.log(data)
} 

/* watch(treeList,() => {
  if(isParentChild.value && isChild.value){
     const children = treeList.value.find(item => item.pid != -1)
    //  找不到，说明没有子节点，就开启父节点的显示
    if(!children){
      console.log('treeList没有子节点了------------------------------------------------------------------')
      isChild.value = false
      isEnd.value = null
    }
  }
},{deep:true}) */


const addParent = () => {
  isParentChild.value = true
  disabledAddParent.value = false
  allShow.value = false
  isHasChild.value = false
  currentEditID.value = null
  isChildId.value = null 
  isEnd.value = null
  isEndParent.value = true
  isNormal.value = true
  isDraggable.value = false
  // 生成一个新的唯一 ID
    const newId = Date.now(); // 您可以根据实际情况使用其他方法生成唯一 ID

// 创建一个新的父分类对象
const newParent = {
  id: newId,
  pid: -1, // 顶级分类的 pid 通常为 -1
  name: '', // 新增的父分类名称
  children: [], // 初始化子节点为空数组
  flag: true,
  isSave: false,
  isCheck: false,
  isReset: false,
  isParent:true
};

treeList.value.push({
    cate_id: newId,
    name: '',
    pid: -1
  })



// 将新的父分类对象添加到 cateData 中
cateData.value.push(newParent);

  category[newId] = ""


  nextTick(() => {
    focusInput(newId)
    if (!category[newId].trim()) {
      const node = treeRef.value.getNode(newId)
      console.log('开始添加', node)
      if (node) {
        modifyNodes(node.parent.data)
      }
    }
  })

  



  /* beforeCount = nativeData.length
  console.log(beforeCount) */
}


// if的语句选择大的复选框(父节点)，该函数会被调用多次，只要选择子节点才会触发1次
// if之外的语句取消选择也会调用
// checkedNode是个节点数组
const handleChecked = (checkedNode,checked) => {
  if(checked){

  }
}

const checkedIds = ref(null)

// 只要勾选了至少1个或者1个都没勾选，才会调用，且只调用1次
// if的语句是勾选了触发，if之外是取消勾选和勾选都会触发
// 第二个参数是个对象，这里用了对象解构
const getCheck = (checkedNodes,{checkedKeys}) => { 
  isDraggable.value = checkedKeys.length === 0
  // 有没有选中
  if(checkedKeys.length > 0){
    console.log(checkedKeys)
    allShow.value = false
    disabledAddParent.value = true
     const isDuplicate = cateData.value.find(item => item.id === checkedKeys[0])
    if(isDuplicate){
      // 选择了大的复选框，就选择最前面的id
      checkedIds.value = checkedKeys[0]
      console.log('选择了大复选框')
    }else {
      // 选择的是子节点的父选框，那就选择最后1个id
      checkedIds.value = checkedKeys[checkedKeys.length-1]
    }
    // 没有选中
  }else {
    checkedIds.value = null
    allShow.value = true
    disabledAddParent.value = false
  }
}

/* const handleRemove = (data) => {
  const getCheckedKeys = treeRef.value.getCheckedKeys()
  const getCheckedNodes = treeRef.value.getCheckedNodes()
  if(getCheckedKeys.length >0){
    allShow.value = false
    console.log('handleRemove调用了..........',allShow.value)
    if(Array.isArray(getCheckedNodes[0].children)){
       return data.id === getCheckedKeys[0]
    }else return data.id === getCheckedKeys[getCheckedKeys.length -1]
  }else {
    allShow.value = true
  }

} */

//t_category_request:分类删除请求
const batchRemove = async(node,data,isFlag) => {
  const total = treeRef.value.getCheckedKeys().length
  if(isFlag){
    await removeApi(data.id) 
    msg.primary('删除成功')
  }else {
    try {
      await ElMessageBox.confirm(total > 1?'你确认要批量删除么':'你确认要删除么','温馨提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    const getCheckedKeys = treeRef.value.getCheckedKeys()
    await removeApi(getCheckedKeys)
    msg.primary(total > 1?'批量删除成功':'删除成功')
    } catch (error) {
      disabledAddParent.value = false
      render()
      const arr = handleExpand(node)
      expandKey.value = [...arr]
    }
  }
  // t_question 这里写 allShow.value = true 为什么不会生效，在render函数里面写就有效
  // allShow.value = true
  // treeRef.value.getCheckedKeys().splice(0)
  // console.log(treeRef.value.getCheckedKeys())
  disabledAddParent.value = false
  render()
  const arr = handleExpand(node)
  expandKey.value = [...arr]
}

// 设置ref的函数
const setInputRef = (id) => {
  return (el) => {
    if(el){
      inputRefs.value[id] = el
    }
  }
}


const updateNodes = ref([])
const expandKey = ref([])


const defaultProps = {
  children: 'children',
  label: 'name',
  disabled : 'disabled'
}

let nativeData = []

// t_category_request:分类列表请求
const render = async () => {
  const res = await listApi()
  // console.log(res.data)
  cateData.value = res.data
/*   const originData = res.data
  cateData.value = modifyDisabled(originData,isCheckboxDisabled.value) */
  console.log('render中...')
  console.log(res.data)
  // 同一个地址
  // nativeData = [ ...res.data ]

  // 不同的地址
  nativeData = JSON.parse(JSON.stringify(res.data))
  // console.log(nativeData)

  // 结束编辑
  isEdit.value = false

  // 显示所有
  allShow.value = true

  // 启用拖拽
  isDraggable.value = true

  // 重置数据
  if(Reflect.ownKeys(category).length >0){
    for(const k in category){
        delete category[k]
    }
  }

}

/* const processData = computed(()=>{
  return modifyDisabled(cateData.value,isCheckboxDisabled.value)
}) */

render()

const category = reactive({
})

let beforeCount = 0

//t_category_request:分类修改请求(拖拽)
// 拖拽节点规则
const allowDrop = (draggingNode, dropNode, type) => {
  const draggingLevel = draggingNode.level;
  const droppingLevel = dropNode.level;

  // 获取拖拽节点和目标节点的子节点
  const hasDraggingChildren = draggingNode.childNodes && draggingNode.childNodes.length > 0;

  if (type === 'inner') {
    // 允许2级节点拖拽到1级节点内部
    if (draggingLevel === 2 && droppingLevel === 1) {
      return true;
    }
    // 当1级节点没有子节点时，允许将其拖拽到其他1级节点内部
    /* if (draggingLevel === 1 && droppingLevel === 1 && !hasDraggingChildren) {
      return true;
    } */
    // 其他情况不允许拖拽
    // return false;
  } else if (type === 'prev' || type === 'next') {
    // 允许2级节点拖拽到1级节点的前后
    /* if (draggingLevel === 2 && droppingLevel === 1) {
      return true;
    } */
    // 当1级节点没有子节点时，允许将其拖拽到其他1级节点的前后
    /* if (draggingLevel === 1 && droppingLevel === 1 && !hasDraggingChildren) {
      return true;
    } */
    // 允许1级节点之间互相拖拽（无论是否有子节点）
    if (draggingLevel === 1 && droppingLevel === 1) {
      return true;
    }
    // 允许2级节点之间互相拖拽
    if (draggingLevel === 2 && droppingLevel === 2) {
      return true;
    }
    // 其他情况不允许拖拽
    // return false;
  }
  // 其他情况不允许拖拽
  return false;
}

// 收集拖拽节点数据提交服务器
const handleDrop = async(
  draggingNode,
  dropNode,
  dropType,
  ev,
) => {


  let pid = -1;
  let siblings = [] 
  console.log('tree drop:', draggingNode,dropNode,dropType)
  if(dropType === "before" || dropType === "after"){
     pid = dropNode.parent.data.id === undefined ? -1 :dropNode.parent.data.id
     siblings = dropNode.parent.childNodes
  }else {
    pid = dropNode.data.id
    siblings = dropNode.childNodes
  }

  const total = siblings.length

  // 使用forEach实现
  /* siblings.forEach((item,index) => {
    // 如果遍历的是当前正在拖拽的节点，就新增一个属性父id
    if(item.data.id === draggingNode.data.id){
      updateNodes.value.push({id:item.data.id,sort:index,pid})
    // 其他节点则正常排序
    }else updateNodes.value.push({id:item.data.id,sort:index})
  }) */

  // 使用map实现
  updateNodes.value = siblings.map((item,index) => {
       // 如果遍历的是当前正在拖拽的节点，就新增一个属性父id，否则其他节点正常排序
    if((item.data.id === draggingNode.data.id)) return {id:item.data.id,sort:total-index-1,pid}
    else return {id:item.data.id,sort:total-index-1}
  })

  // 提交服务器
  await modifyApi(updateNodes.value)
  msg.primary('节点拖拽成功')
  render()
  updateNodes.value = []	
  expandKey.value = [pid]
}


const append = (node, data) => {
  console.log(node)
  disabledAddParent.value = true
  isEnd.value = null
  isNative.value = true
  isNormal.value = true
  isDraggable.value = false
  /* const arr = disabledCheckboxes(node.data.children)
  node.data.children = [...arr]
  Object.assign(node.data,{...node.data,disabled:true}) */

  console.log('append-----------------------') //可以打印
  
  modifyNodes(node.parent.data)



  // 全部节点，是个数组
  // console.log(node.parent.childNodes)
  beforeCount = data.children && data.children.length > 0?data.children.length : 0
  // console.log('beforeCount',beforeCount)

  allShow.value = false
  // 初始化 category 对象
  node.expanded = true
  const newId = Date.now()

  // 向当前节点的 children 数组中添加一个新的子节点
  data.children.push({
    id: newId,
    name: '',
    children: [],
    flag: true,
    isSave: false,
    isCheck: false,
    isReset: false,
    disabled:true
  })

  treeList.value.push({
    cate_id: newId,
    name: '',
    pid: data.id
  })

  nextTick(()=>{
    focusInput(newId)
  })
  // 避免为undefined
  category[newId] = ""
}
// 当前编辑行
const currentEditID = ref(null)
// 控制当前是否在编辑
const isEdit = ref(false)
// 数组中的最后一个元素，需要参考differentArr数组
const isLast = ref(null)

// blur事件触发的时候存储differentArr和sameArr，等到点击撤销按钮还有虚拟修改按钮的时候校验
// 输入框不相同的分类名字，存储到这里
const differentArr = []

// 输入框相同的分类名字，存储到这里
// const sameArr = []

// 过滤满足不为空和不重名的数组
// 注意，filter后会返回一个新数组，所以这里只能用let声明
let filterArr = []
// let filterSubArr = []

// isReturn用来控制键盘事件执行blur事件之后是否执行后续代码(提交服务器)
// 在 handleBlur 函数，如果空值还有重复 isReturn 的值则为true，键盘事件将不在执行后续代码
// 一上来设置为false的原因是为了重置数据
const isReturn = ref(false)

/* if(item.data.disabled !== undefined){
          // 如果存在disabled属性，则修改
          item.data.disabled = isCheckboxDisabled.value
        }else {
          // 如果不存在则添加disabled属性
          Object.assign(item.data,{...item.data,disabled:isCheckboxDisabled.value})
  } */

// 修改节点
const modifyNodes = (node) => {
    isCheckboxDisabled.value = true
  node.forEach(item =>{
      if(item.children && item.children.length > 0){
        const arr = modifyDisabled(item.children,isCheckboxDisabled.value)
        item.children = [...arr]
        Object.assign(item,{...item,disabled:isCheckboxDisabled.value})
      }else Object.assign(item,{...item,disabled:isCheckboxDisabled.value})
  })
}


// 递归函数
const modifyDisabled = (data,disabled) => {
  return data.map(item => {
    const newItem = { ...item, disabled };
    if (item.children && item.children.length > 0) {
      newItem.children = modifyDisabled(item.children, disabled);
    }
    return newItem;
  });
}

const enabledCheckboxes = ()  => {
    isCheckboxDisabled.value = false
    cateData.value = modifyDisabled(cateData.value,isCheckboxDisabled.value)
}

const disabledCheckboxes = () => {
  isCheckboxDisabled.value = true
  // return modifyDisabled(data,isCheckboxDisabled.value)
  cateData.value = modifyDisabled(cateData.value,isCheckboxDisabled.value)
}

const handleParentBlur = (node,data) => {

    console.log("treeList.value",treeList.value)
    const children = findPrevSubCate()
    if (category[data.id]?.trim() === '') {
      console.log("输入为空，findPrevSubCate()",findPrevSubCate())
   // 新增事件的空值处理
      /* if(isNormal.value && findPrevSubCate().length === 0 ){
        console.log("输入为空，没有子节点",findPrevSubCate())
          // 说明没有子节点
          isChild.value = false
        }else isChildId.value = children[children.length - 1] */
        if(isNormal.value && findPrevSubCate().length === 0 ){
        console.log("输入为空，没有子节点",findPrevSubCate())
          // 说明没有子节点
          isChild.value = false
        }else isChildId.value = children[children.length - 1]
      if(node.level > 1 && findPrevSubCate().length === 0){
        isEndParent.value = true
      }else {
        isEndParent.value = false
      }

       // 如果是父节点(非叶子节点)且输入为空，则复原回上一次的值
      if(!isNormal.value && parentData.value && !node.isLeaf){
        console.log(`==================== parentData.value ${parentData.value} ====================`)
        category[data.id] = parentData.value
      }else {
        // 移除新增的子节点
        console.log("==================== 为空删除整个节点 ====================")
        removeParentElement(node,data)
      }

      // 如果是子节点且输入为空，那么执行filterArr过滤操作
      if(!isNormal.value && node.isLeaf){
        removeParentFilter(node,data)
        if(handleIsEndLeafParent(node)){
          console.log('没有进入表达式1吗？')
          // isChild.value = false
          isEndParent.value = true
        }else {
          console.log('没有进入表达式2吗？')
          handleHasChild(node);
        }
      } else {
        if (handleIsEndLeafParent(node)) {
          isChild.value = false
          isEndParent.value = true
        } else {
          isChild.value = true
          isEndParent.value = false
        }
      }


      msg.error('请输入内容')
      if(treeList.value.length === 0){
        msg.error('回到最原始的数据')
        disabledAddParent.value = false
        allShow.value = true
        // t_reset：handleBlur初始化(新增父子模式)
        isDraggable.value = true
        isHasChild.value = false
        const arr = handleExpand(node)
        expandKey.value = [...arr]
        isParentChild.value = false
        isChild.value = false
        isChildId.value = null
        // 启用复选框
        enabledCheckboxes()
      }
      isReturn.value = true
      handleParentBlurCallback(data)
      return;
    }

    const childrenList = handleAllNodes(node)

    // 排除名字相同的子分类
    const isDuplicate = childrenList.find(item => {
      // 把自己排除
      if (data.id != item.id) {
        return item.name === category[data.id]
      }

    })

    if (isDuplicate) {
      if(isNormal.value && findPrevSubCate().length === 0 ){
        console.log("输入为空，没有子节点",findPrevSubCate())
          // 说明没有子节点
          isChild.value = false
        }else isChildId.value = children[children.length - 1]
        if(node.level > 1 && findPrevSubCate().length === 0){
        isEndParent.value = true
        }else {
         isEndParent.value = false
      }

      // 如果是父节点(非叶子节点)且输入重复，则复原回上一次的值
      if(!isNormal.value && parentData.value && !node.isLeaf){
        console.log(`==================== parentData.value ${parentData.value} ====================`)
        category[data.id] = parentData.value
      }else {
        // 移除重复的子节点
        console.log("==================== 重复删除整个节点 ====================")
        removeParentElement(node,data)
      }

      // 如果是子节点且输入重复，那么执行filterArr过滤操作
      if (!isNormal.value && node.isLeaf) {
        removeParentFilter(node, data)
        if (handleIsEndLeafParent(node)) {
          // isChild.value = false
          isEndParent.value = true
        } else {
          handleHasChild(node);
        }
      } else {
        console.log('filter-pop后', filterArr)
        if (handleIsEndLeafParent(node)) {
          isChild.value = false
          isEndParent.value = true
        } else {
          isChild.value = true
          console.log('这句话没生效吗', isChild.value)
          isEndParent.value = false
        }
      }
        msg.error('分类名不能重复')
        isReturn.value = true
        // isNormal.value = true
    }else {
      // 代码走到这里，说明非空并且不重复
      filterArr.push(data.id)
      if(node.level > 1){
        isChildId.value = data.id
        parentData.value = node.parent.data.name
      }
      if(findPrevSubCate().length > 0){
          // 说明有子节点
          console.log("有子节点",findPrevSubCate())
          isChild.value = true
        }
        if(findPrevSubCate().length > 0 && node.level > 1){
          isEndParent.value = false
        }
      console.log('push',filterArr)
      // console.log("isChildId.value",isChildId.value)
    }

      // console.log(data)
        // 如果一开始的长度跟后面新增的长度一致，说明没有新增的元素，则显示全部按钮
        if (treeList.value.length === 0) {
          console.log('没有新增的元素')
            // t_reset：handleBlur初始化(新增父子模式)
            disabledAddParent.value = false
            const arr = handleExpand(node)
            expandKey.value = [...arr]
            isParentChild.value = false
            isChild.value = false
            isChildId.value = null
            isDraggable.value = true
            isHasChild.value = false
          // 启用复选框
          enabledCheckboxes()
          allShow.value = true
          return;
        }

        handleParentBlurCallback(data)
}

const handleParentBlurCallback = (data) => {
    // 更新子分类名称(针对新增模式，往 treeList 数据赋值，提交服务器)
  data.name = category[data.id]
  const subItem = treeList.value.find(item => item.cate_id === data.id)
  if (subItem) {
    subItem.name = data.name
  }


    setTimeout(() => {
      // 隐藏输入框
      data.flag = false
      // 显示确定按钮
      data.isSave = true
      // 显示虚拟修改按钮
      data.isCheck = true
      // 显示虚拟恢复按钮
      data.isReset = true
    }, 200);
}


const handleBlur = (node, data) => {
  isReturn.value = false

  if(isParentChild.value){
    handleParentBlur(node,data)
    return;
  }
  // console.log(node, data)
  // currentEditID.value = data.id

  /*     console.log(data)
      console.log(category) */

  /*  if(!category[data.id]){
       category[data.id] = ''
   } */

  // 非法判断1
  console.log('blur事件',category[data.id])
  if (category[data.id]?.trim() === '') {
    console.log('空值处理')
    if (isEdit.value) {
      // 编辑事件的空值处理
      const nativeName = revertData(node.level, data)
      data.name = nativeName
      category[data.id] = nativeName
      if(differentArr.length === 0){
        // t_reset：handleBlur初始化(编辑模式)
        disabledAddParent.value = false
        isDraggable.value = true
        allShow.value = true
        console.log('different为空了')
        isEdit.value = false
        handleDuplicate(data)
        const arr = handleExpand(node)
        expandKey.value = [...arr]
        // 启用复选框
        enabledCheckboxes()
        // msg.error('数据恢复成功')
      }else {
        differentArr.forEach((item,index) => {
          if(index === differentArr.length -1) {
            isLast.value = item
            console.log('最后一个元素到底是谁',item)
          }
        })
        isEdit.value = true
        handleDuplicate(data)
          // 禁用复选框
        disabledCheckboxes()
      }
      msg.error('请输入内容')
      isReturn.value = true
      return;
    } else {
      // 新增事件的空值处理
      // console.log('输入为空')
      msg.error('请输入内容')
      if(!isNormal.value){
        removeFilter(data.id)
      }
      // 移除新增的子节点
      const afterCount = removeElement(node,data)
      if(beforeCount === afterCount){
        allShow.value = true
        // t_reset：handleBlur初始化(新增模式)
        disabledAddParent.value = false
        isDraggable.value = true
        const arr = handleExpand(node)
        expandKey.value = [...arr]
        // 启用复选框
        enabledCheckboxes()
      }
      isReturn.value = true
      return;
    }
  }




  // 非法判断2
  // 编辑事件的处理(存储数据)
  // 新增事件的处理(判断名字是否重复)
  if (isEdit.value) {

    
  const newName = category[data.id]
  const originName = revertData(node.level, data)
  const isDuplicate = checkDuplicateContainName(newName)

  if(isDuplicate){
    const originalName = revertData(node.level, data)
    data.name = originalName
    category[data.id] = originalName
    if(differentArr.length === 0){
        // t_reset：handleBlur初始化(编辑模式)
        disabledAddParent.value = false
        isDraggable.value = true
        allShow.value = true
        isEdit.value = false
        handleDuplicate(data)
        const arr = handleExpand(node)
        expandKey.value = [...arr]
        // msg.error('数据恢复成功')
        // 启用复选框
        enabledCheckboxes()
      } else {
        differentArr.forEach((item, index) => {
          if (index === differentArr.length - 1) {
            isLast.value = item
            console.log('最后一个元素到底是谁', item)
          }
        })
        isEdit.value = true
        handleDuplicate(data)
        // 禁用复选框
        disabledCheckboxes()
      }
      // 如果名字和原先名字不同，则不提示任何修改
      if(originName != newName){
        msg.error('分类名不能重复')
      }
      isReturn.value = true
      return;
  }else {
      let isRepeat;
      if(differentArr.length > 0 ){
        isRepeat = differentArr.find(item => item === data.id)
      }
      // if(!isRepeat && currentRevertId.value != data.id ) differentArr.push(data.id)
      if(!isRepeat ) differentArr.push(data.id)
  }

  } else {
    // 排除名字相同的子分类
    /* const isDuplicate = node.parent.data.children.find(item => {
      // 把自己排除
      if (data.id != item.id) {
        return item.name === category[data.id]
      }

    }) */

    const nodeList = handleAllNodes(node)

    const isDuplicate = nodeList.find(item => {
      // 把自己排除
      if(data.id != item.id){
        return item.name === category[data.id]
      }
    })



    // console.log(isDuplicate)
    let afterCount;
    if (isDuplicate) {
        if(!isNormal.value){
          removeFilter(data.id)
        }
        console.log('filter-pop后',filterArr)
        afterCount = removeElement(node,data)
        msg.error('分类名不能重复')
        isReturn.value = true
        // isNormal.value = true
    }else {
      // 代码走到这里，说明非空并且不重复
      filterArr.push(data.id)
      console.log(filterArr,'filterArr')
    }

      // console.log(data)
        // 如果一开始的长度跟后面新增的长度一致，说明没有新增的元素，则显示全部按钮
        if (beforeCount === afterCount) {
          console.log('没有新增的元素')
            // t_reset：handleBlur初始化(新增模式)
            disabledAddParent.value = false
            const arr = handleExpand(node)
            expandKey.value = [...arr]
          isDraggable.value = true
          // 启用复选框
          enabledCheckboxes()
          allShow.value = true
          return;
        }



  }


  // 更新子分类名称(针对新增模式，往 treeList 数据赋值，提交服务器)
  data.name = category[data.id]
  const subItem = treeList.value.find(item => item.cate_id === data.id)
  if (subItem) {
    subItem.name = data.name
  }




    setTimeout(() => {
      // 隐藏输入框
      data.flag = false
      // 显示确定按钮
      data.isSave = true
      console.log('handleBlur',data)
      // 显示虚拟修改按钮
      data.isCheck = true
      // 显示虚拟恢复按钮
      data.isReset = true
    }, 200);
}

// 封装方法：检查名称是否重复（排除自身）
const checkDuplicateName = (data, newName) => {
  return nativeData.some(item => 
    (item.id !== data.id && item.name === newName) ||
    (item.children?.some(child => child.id !== data.id && child.name === newName))
  )
}

// 封装方法：检查名称是否重复(不排除自身)
const checkDuplicateContainName = (newName) => {
  return nativeData.some(item => 
    item.name === newName ||
    (item.children?.some(child => child.name === newName))
  )
}

const handleDuplicate = (data) => {
  data.isEdit = false
  data.flag = false
  data.isSave = false
  data.isCheck = false
  data.isReset = false
  delete category[data.id]
}



// (data.isParent区分是父分类，isParentChild是父分类和子分类共有的)
const isParentChild = ref(false)

const isChild = ref(false)


const isChildId = ref(null)

const isEndParent = ref(true)


// 批量添加子类
const batchAddParentChild = (node,data) => {
  disabledAddParent.value = false
  console.log("data.id",data.id)
  isParentChild.value = true
  isHasChild.value = false
  isChildId.value = null
  isEndParent.value = false
  isNormal.value = true
  isEnd.value = null 
  node.expanded = true
  /* if(isChild.value){
    isChild.value = false
  } */
  if(!isChild.value){
    isChild.value = true
  }
  const arr = node.level < 2  ?node.data.children : node.parent.data.children
  const parentId = node.level < 2 ? node.data.id :node.parent.data.id

  isDraggable.value = false
  //禁用复选框
  // modifyNodes(node.parent.data)
  // disabledCheckboxes()

  const newId = Date.now()

 

  // 向父节点的 children 数组中添加一个新的子节点
    arr.push({
    id: newId,
    name: '',
    children: null,
    // 控制span和输入框的切换
    flag: true,
    // 控制确定按钮的切换
    isSave: false,
    // 控制修改的切换
    isCheck: false,
    // 控制关闭的切换
    isReset: false,
    disabled:isCheckboxDisabled.value
  })

  // console.log('parentId',parentId)
  treeList.value.push({
      cate_id: newId,
      name: '',
      pid: parentId
    })

 
  nextTick(()=>{
    focusInput(newId)
  })

  category[newId] = ""
}

// 批量添加
const batchAdd = (node, data) => {
  if(isParentChild.value){
    batchAddParentChild(node,data)
    return;
  }
  disabledAddParent.value = true
  console.log(node)
  isDraggable.value = false
  //禁用复选框
  modifyNodes(node.parent.parent.data)
  // disabledCheckboxes()
  isNormal.value = true
  isEnd.value = null 
  const newId = Date.now()

  // 向父节点的 children 数组中添加一个新的子节点
  node.parent.data.children.push({
    id: newId,
    name: '',
    children: null,
    // 控制span和输入框的切换
    flag: true,
    // 控制确定按钮的切换
    isSave: false,
    // 控制修改的切换
    isCheck: false,
    // 控制关闭的切换
    isReset: false,
    disabled:isCheckboxDisabled.value
  })

  treeList.value.push({
    cate_id: newId,
    name: '',
    pid: node.parent.data.id
  })

  nextTick(()=>{
    focusInput(newId)
  })

  category[newId] = ""
}

const handleAdd = (node,data,isPublish) => {
  /* if(isParentChild.value && isEnd.value) {
      console.log('表达式1.1执行...')
       return !isEdit.value  && isEnd.value === data.id
} */
// 针对添加父子分类：
if(isParentChild.value && isEnd.value || isHasChild.value) {


  if (isPublish) {
    if (isHasChild.value) {
      return showParent(node,data) || handleLastParent(node,data)
    } else return isEnd.value === data.id
  } else {
    console.log("表达式1.2执行......")
    return (!isEdit.value && data.isSave && !data.isParent && handleChildToggle(node,data)) || (!isEdit.value && data.isSave && handleParentToggle(node, data) && nativeData.find(item => item.id != data.id))
  }

    /* if(data.isParent != undefined ){
      console.log('表达式1.1执行...')
       return !isEdit.value && data.isSave && isChildId.value === data.id
    }else {
      console.log('表达式1.2执行...')
      return isEnd.value === data.id
    } */
  //  return  isNative.value ?!isEdit.value && data.isSave && isLastParentChild(node, data) : isEnd.value === data.id
}


  if(isParentChild.value && !isPublish){
      // 批量添加按钮(完成)
      if(isNormal.value) {
        // console.log('表达式2.1执行...')
        // 正常模式：
        // 控制子节点：!isEdit.value && data.isSave && !data.isParent && isLastParentChild(node,data)
        // 控制父节点：!isEdit.value && data.isSave && handleParentToggle(node,isPublish) && nativeData.find(item => item.id != data.id)
        return (!isEdit.value && data.isSave && !data.isParent && isLastChild(node,data)) || (!isEdit.value && data.isSave && handleParentToggle(node,data) && nativeData.find(item => item.id != data.id))
      }else {
        // console.log('表达式2.2执行...')
        // 特殊模式(虚拟修改)
        
        return (!isEdit.value && data.isSave && !data.isParent && handleChildToggle(node,data)) || (!isEdit.value && data.isSave && handleIsNormalParent(node,data) && nativeData.find(item => item.id != data.id))
        // return (!isEdit.value && data.isSave && !data.isParent && handleToggle(node,data)) || (!isEdit.value && data.isSave && handleParentToggle(node,isPublish) && nativeData.find(item => item.id != data.id))
      }
  }

  if(isParentChild.value && isPublish){
      // 提交服务器按钮
      if(isNormal.value) {
        // 控制子节点
        if(isChild.value){
          // console.log('表达式3.1执行...')
          // 一旦添加了子分类(非空且不重复)，会走这个表达式
          return (!isEdit.value && data.isSave  && showParent(node,data)) || (data.isSave && handleLastParent(node,data))
        }else {
          // 控制父节点
          // console.log('表达式3.2执行...')
          // watch 监视到了没有子节点，会走这个表达式
          // 添加父分类(没有添加子分类)的时候也会走这个表达
          return !isEdit.value && data.isSave && isLastAll(node,data) && handleParentToggle(node,isPublish) 
        }
        
      }else {
        // console.log('表达式3.3执行...')
        return (!isEdit.value && data.isSave && handleParent(node,data)) || (data.isSave && handleLastParent(node,data))
      }
  }


 // 针对添加子分类
  if(!isParentChild.value && isEnd.value) {
      // console.log('表达式1执行...')
    return  isNative.value ?!isEdit.value && data.isSave && isLastChild(node, data) : isEnd.value === data.id
  }


  if(!isParentChild.value && isNormal.value){
    // console.log('表达式4.1执行...')
    return !isEdit.value && data.isSave && isLastChild(node, data)
  }else {
    // console.log('表达式4.2执行...')
    return !isEdit.value && data.isSave && currentEditID.value === data.id
  }
}

const handleInclude = (id) => {
  return differentArr.some(item => item=== id)
}

const handleAllNodes = (node) => {
  const arr = []
  const children = node.level < 2?node.parent.data:node.parent.parent.data
  children.forEach(item => {
    arr.push(item)
    if(item.children && item.children.length > 0){
       item.children.forEach(item => {
        arr.push(item)
       })
    }
  })

  return arr
}

const removeElement = (node,data,specific=false) => {
  let afterCount
  const childList = node.parent.data.children
  const index = childList.indexOf(data)
  if(index > -1){
    // 删除为空和重复的非法元素
    afterCount = childList.length-1
    !specific?treeList.value.pop():removeSpecificElement(data)
    childList.splice(index,1)
    delete category[data.id]
    return afterCount
  }
}

// 删除 treeList 指定的元素，针对handleRevert
const removeSpecificElement = (data) => {
  const subCate = treeList.value.find(item => item.cate_id === data.id)
  const index = treeList.value.indexOf(subCate)
  if(index > -1){
    treeList.value.splice(index,1)
  }
}

const removeParentRevert = (node,data) =>{
    let arr = []
   if(node.level < 2) {
    const childrenId = node.data.children.map(item => item.id)
     arr = [...childrenId]
     arr.push(node.data.id)
     console.log('arr',arr)
     arr.forEach(item => delete category[item])
     treeList.value = treeList.value.filter(item => !arr.includes(item.cate_id))
     console.log('treeList.value',treeList.value)
   }else {
     const cateItem = treeList.value.find(item => item.cate_id === data.id)
     console.log('cateItem',cateItem)
     const index = treeList.value.indexOf(cateItem)
     if(index > -1){
      treeList.value.splice(index,1)
      delete category[data.id]
    }
   }

}

const removeTreeNode = (node,data) => {
    const arr = node.level < 2  ? node.parent.data :node.parent.data.children
    let index;
    if(node.level < 2) {
      // 删除父节点，子节点会自动删除
      index = arr.indexOf(data)
    }else {
      index = arr.indexOf(data)
    }
    arr.splice(index,1)
}


// 针对校验的父子分类删除
/* const removeParentElement = (node,data) => {
  // let afterCount
  console.log(node.parent.data)
  const childList = node.level < 2 ? node.parent.data:node.parent.data.children
  console.log('childList',childList)
  const index = childList.indexOf(data)
  if(index > -1){
    // 删除为空和重复的非法元素
    // afterCount = childList.length-1
    treeList.value.splice(index,1)
    childList.splice(index,1)
    delete category[data.id]
    console.log("删除为空和重复的非法元素")
    // console.log(afterCount,'afterCount')
    // return afterCount
  }
} */


const removeParentElement = (node, data) => {
  console.log(node.parent.data)
  const childList = node.level < 2 ? node.parent.data : node.parent.data.children
  console.log('childList', childList)
  
  const index = childList.indexOf(data)
  if (index > -1) {
    // 检查是否是父节点且有子节点
    const isParentNode = node.level < 2
    const hasChildren = data.children && data.children.length > 0
    const isNormalMode = !isNormal.value
    
    if (isParentNode && hasChildren && isNormalMode) {
      // 非正常模式 + 父节点有子节点：删除所有相关数据
      console.log('删除父节点及其所有子节点')
      
      // 1. 收集所有节点ID
      const allNodeIds = [data.id]
      if (data.children) {
        data.children.forEach(child => {
          allNodeIds.push(child.id)
        })
      }
      
      // 2. 删除DOM节点（父节点）
      childList.splice(index, 1)
      
      // 3. 清理所有相关数据
      allNodeIds.forEach(nodeId => {
        delete category[nodeId]
        
        const treeIndex = treeList.value.findIndex(item => item.cate_id === nodeId)
        if (treeIndex !== -1) {
          treeList.value.splice(treeIndex, 1)
        }
      })
      
    } else {
      // 其他情况：只删除当前节点
      console.log("删除单个节点")
      childList.splice(index, 1)
      delete category[data.id]
      
      const index1 = treeList.value.findIndex(item => item.cate_id === data.id)
      if (index1 !== -1) {
        treeList.value.splice(index1, 1)
      }
    }
  }
}

// 删除 treeList 指定的元素，针对handleRevert 新增模式
/* const removeParentSpecificElement = (data) => {
  const subCate = treeList.value.find(item => item.cate_id === data.id)
  const index = treeList.value.indexOf(subCate)
  if(index > -1){
    treeList.value.splice(index,1)
  }
} */



// 还原原始数据的方法
const revertData = (level, data) => {
  if (level === 1) {
    const cate = nativeData.find(item => item.id === data.id)
    return cate.name
  } else {
      const cate = nativeData.find(item => item.id === data.pid)
      // console.log('找不到的', cate)
      // console.log(cate)
      if (cate?.children != null && cate.children.length > 0) {
        const subCate = cate.children.find(item => item.id === data.id)
        // console.log(subCate.name)
        return subCate?.name
      }
    }
}


const confirm = async (e,node,data) => {
  if(inputRefs.value[data.id]){
    inputRefs.value[data.id].blur()
  }

  if(isReturn.value){
    return;
  }
  data.isSave = false
  console.log('键盘事件')

  handleSave(e,node,data)
}




const handleEdit = (node, data) => {
  disabledAddParent.value = true
  isDraggable.value = false
  // disabledCheckboxes()
  currentEditID.value = data.id
  // 重置：只要点击编辑，就禁用确定按钮
  isDisabled.value = true
  isLast.value  = null
  isEdit.value = true
  data.flag = true
  data.isSave = true
  data.isReset = false
  data.isEdit = false
  //视图数据 点击了哪个编辑按钮，就隐藏哪个编辑按钮，
  if (currentEditID.value == data.id) {
    data.isEdit = true
  }
  nextTick(()=>{
    focusInput(data.id)
  })
  // console.log(node, data)
  allShow.value = false
  category[data.id] = data.name
  if(node.level < 2){
    modifyNodes(node.parent.data)
  }else {
    modifyNodes(node.parent.parent.data)
  }

  console.log('data',data)
}

const handleParentDuplicate = (node,res) => {
  allShow.value = true
  isParentChild.value = false
  isChild.value = false
  isChildId.value = null
  isHasChild.value = false
  isEnd.value = null
  isNormal.value = false
  isEndParent.value = false
  render()
  const arr = handleExpand(node)
  // 改变内部数组元素为id
  if(res){
    res.data.forEach(parentItem => {
    arr.forEach((item,index) => {
      if(item == parentItem.cateId){
         arr[index] = parentItem.id
      }
    })
  })
  expandKey.value = [...arr]
  }
  msg.primary('添加成功')
  // console.log("node.store.nodesMap",node.store.nodesMap)
  // console.log("arr",arr)
}

// t_category_request:分类列表请求(一级分类)
// t_category_request:分类新增请求(一级分类)
const handleBatchSave = async(node) => {
  try {
      
  const parentList = treeList.value.filter(item => item.pid === -1 )
  const childList = treeList.value.filter(item => item.pid != -1)
  const newParents = parentList.map((item,index) => ({
    ...item,
    cateId:item.cate_id + ''
  }))

  // 提交添加父分类请求
  await addApi(newParents)

  if(findPrevSubCate().length === 0 ) {
    console.log('没有子节点了？')
    handleParentDuplicate(node)
    treeList.value = []
    return;
  }

  // 提交查询父分类请求
  const cateIds = newParents.map(item => item.cateId)
  const res = await listApi(cateIds+'') //要把它转成json串数组
  // const res = await listApi(cateIds) //这样传会报错
  console.log('res.data',res.data)

  const parentMap = res.data.reduce((cate,item) => {
    cate[item.cateId] = item.id
    return cate
  },{})

  console.log("parentMap",parentMap)

   const updateChildren = childList.map( item=> ({
    name:item.name,
    pid: parentMap[item.pid],
  }))

  console.log("updateChildren",updateChildren)
  // 提交添加子分类请求
  await addApi(updateChildren)
  handleParentDuplicate(node,res)
  treeList.value = []
  } catch (error) {
    console.log('错误了...',error)
    msg.error(error)
    // 根据需要处理错误，例如显示错误消息或回滚操作
  }

}


//t_category_request:分类新增请求
//t_category_request:分类修改请求
const handleSave = async (e, node, data) => {
  data.isSave = false
  e.stopPropagation()
  /* const newtreeList = treeList.value.map(item =>{
      delete item.cate_id
      return {...item}
  }) */
  if(isParentChild.value){
    handleBatchSave(node,data)
    return;
  }
  

  //编辑事件的提交
  if (isEdit.value) {
    const cateNames = []
    for (const prop in category) {
      // t_handle:待删除(重复的查找)
      /* const flag = nativeData.find(item => item.id === prop * 1)
      let isDuplicate;

      if (flag) {
        isDuplicate = revertData(true, prop * 1)
      } else isDuplicate = revertData(false, prop * 1)

      if (isDuplicate === category[prop]) {
        msg.error('有重复的数据，提交失败')
        allShow.value = true
        render()
        const arr = handleExpand(node, data)
        expandKey.value = [...arr]
        return;
      } */
      
      cateNames.push({
        id: prop,
        name: category[prop]
      })
    }
    console.log(cateNames)
    await modifyApi(cateNames)
    msg.primary('修改成功')

  } //新增事件的提交
  else {
    if (treeList.value.length > 0) {
      await addApi(treeList.value)
      msg.primary('添加成功')
      treeList.value = []
    } else msg.error('添加失败')
  }
  allShow.value = true
  // t_reset：handleSave初始化(新增编辑模式)
  disabledAddParent.value = false
  isDraggable.value = true
  // 启用复选框
  enabledCheckboxes()
  render()
  const arr = handleExpand(node)
  // console.log("node.store.nodesMap",node.store.nodesMap)
  // console.log("arr",arr)
  expandKey.value = [...arr]


}

// 展开的处理
const handleExpand = (node) => {
  const arr = []
  let tree = node.store.nodesMap
  for (const k in tree) {
    if (tree[k].level <= 1 && tree[k].expanded === true) {
      arr.push(tree[k].data.id)
    }
  }
  if (arr.length === 0) {
    arr.push({})
  }
  return arr
}

const handleResetExpand = () => {
  // const parentNode = treeRef.value.getNode(1)
  const parentNodes = []
  cateData.value.forEach(item => {
    parentNodes.push(treeRef.value.getNode(item.id))
  })
  // console.log("parentNodes",parentNodes)
  if(parentNodes.length > 0){
      const parentIds = parentNodes.filter(item => item.expanded === true).map(item => item.data.id)
      return parentIds
  }
}

// 正常模式和特殊模式以及排序模式切换(针对新增模式，会影响确定按钮和批量添加按钮的显示)
// 默认正常模式，用户点击新增和批量添加按钮，都是正常模式
// 用户点击虚拟修改按钮，即切换为特殊模式，
// 点击关闭按钮，排序模式是数组末尾模式
/* 
  正常模式：条件：非编辑模式，确定按钮，是否为最后一个子节点
  特殊模式：条件：非编辑模式，确定按钮，是否为当前节点(当前编辑行)
  排序模式：条件：isEnd.value有值
    handleBlur函数会筛选出不为空和不重复的节点放到一个filterArr数组中(重复的节点也算在内)
    当点击关闭时，handleRevert函数会删除filterArr数组对应id的节点，然后在把数组最后一个元素赋值给isEnd.value
    最后判断 isEnd.value 属于哪个节点

*/
const isNormal = ref(true)

// isNative作用：告诉程序删除(handleRevert)的时候是按照正常模式删除还是排序模式删除
/* 
  监控用户有没有点击虚拟修改按钮
  只要用户没有点击虚拟修改，就按照最后一个节点，即正常模式的删除
  如果用户点击了虚拟修改，就按照排序模式  isEnd.vue，即排序模式的删除
*/
const isNative = ref(true)


/* const findParentId = (id) => {
    for (const item of treeList.value) {
      if(item.cate_id === id)
      return item.pid
    }
}; */


const isBig = ref(false)

const parentData = ref(null)

const handleCheck = (node,data) => {
  data.flag = true
  data.isSave = false
  currentEditID.value = data.id

  if (isParentChild.value) {
    // 针对父子分类模式
    isHasChild.value = false
    isEnd.value = null
    isNormal.value = false
    data.isCheck = false
    data.isReset = false
    isEndParent.value = false

    if(node.level < 2){
      isBig.value = true
      // 新增：每次点击修改时，更新 parentData 为当前父分类名
    if (node.parent && node.data) {
        parentData.value = node.data.name;
        console.log("handleCheck 中更新 parentData:", parentData.value);
    }
    }else isBig.value = false

    nextTick(() => {
      focusInput(data.id)
    })

    }

  if(isEdit.value){
  data.isSave = true
  isLast.value = null 
  differentArr.forEach((item, index) => {
      if (item === data.id) {
        // 点击修改，激活确定按钮
        isDisabled.value = false
        differentArr.splice(index, 1)
      }
    })
    console.log('删除后',differentArr)
  }else {
    isEnd.value = null
    data.isSave = false
    isNormal.value = false
    isNative.value = false    
  }
  data.isCheck = false
  data.isReset = false

  nextTick(()=>{
    focusInput(data.id)
  })
}

// 处理确定按钮的折叠
const handleParent = (node,data) => {
  
   if(node.level < 2 && !node.isLeaf){

    const flag = node.data.children.some(item => item.id === currentEditID.value)

    if(flag || data.id === currentEditID.value){
      return node.expanded?currentEditID.value === data.id:true
    }

   }else return currentEditID.value === data.id
}

// 判断有没有children
const handleParentToggle = (node,data) => {

    if(node.level < 2){
    // 以下两种方式都可以
    //方式一：
    // return node.data.children.length === 0
    //方式二： 该节点是否为叶子节点，也就是没有子节点的节点
    // return node.isLeaf
    if(node.isLeaf){
        return true
      }else {
        return node.expanded?false:true
      }
  }

  // return isPublish?true:false

}

const handleChildToggle = (node,data) => {

  if(isHasChild.value) {
    const flag = node.parent.data.children.some(item => item.id == isChildId.value)
    return flag?isChildId.value === data.id : isLastParentChild(node,data)
  }

  if(isBig.value) {
    if(node.parent.data.id === currentEditID.value){
        return currentEditID.value === data.id
    }
  }

    if(isChild.value){
      const flag = node.parent.data.children.some(item => item.id == currentEditID.value)
      if(flag) {
        return currentEditID.value === data.id
      }else return isLastParentChild(node,data)
    }

    
}

// 处理添加按钮的折叠
const handleIsNormalParent = (node,data) => {
   if(node.isLeaf && node.level < 2){
      return true
   }

   if(node.level < 2 && !node.isLeaf){
      return node.expanded?currentEditID.value === data.id:true
   }
}

// 聚焦输入框的函数
const focusInput = (id) => {
  if(inputRefs.value[id]){
    inputRefs.value[id].focus()
  }
}



// 点击虚拟关闭按钮，确定按钮和批量添加按钮根据filterArr数组中的最后一个来显示
const isEnd = ref(null)

const isHasChild = ref(false)

const handleParentRevert = (node,data) => {
        // isChild.value = true

       // 移除filter数据(标记)
       console.log('删除按钮',data.id)
      removeParentFilter(node,data)

        // 移除新增的子节点(视图上)
      removeTreeNode(node,data)

      if(handleIsEndLeafParent(node)){
        console.log('最后一个没有子节点')
        isChild.value = false
        isEndParent.value = true
      }else{
        console.log('最后一个有子节点')
        isChild.value = true
        isEndParent.value = false
        handleHasChild(node)
      }

     


      // 移除treeList数据(服务器)
      removeParentRevert(node,data)


    if(isNative.value){
      console.log('正常模式的删除')
    }else console.log('特殊模式的删除')

  console.log('filter-pop后',filterArr)
  

  

  // 如果一开始的长度跟后面新增的长度一致，说明没有新增的元素，则显示全部按钮
  if (treeList.value.length === 0) {
    msg.error('回到最原始的数据')
    disabledAddParent.value = false
    // t_reset：handleRevert初始化(新增父子模式)
    isDraggable.value = true
    const arr = handleExpand(node)
    expandKey.value = [...arr]
    isParentChild.value = false
    isChild.value = false
    isChildId.value = null
    isHasChild.value = false
    // 启用复选框
    enabledCheckboxes()
    allShow.value = true
  }
}

const handleRevert = (e,node, data) => {
  e.stopPropagation()
  // 编辑还原数据的事件
  if (isEdit.value) {
    
    currentEditID.value = data.id
    isLast.value = null
    data.isCheck = false
    // data.isReset = false
    data.flag = true
    nextTick(()=>{
          console.log(456)
          focusInput(data.id)
        })
    differentArr.forEach((item, index) => {
      if (item === data.id) {
        const nativeName = revertData(node.level, data)
        data.name = nativeName
        category[data.id] = nativeName
        // 点击恢复按钮，禁用确定按钮
        isDisabled.value = true
        msg.primary('数据恢复成功')
        differentArr.splice(index, 1)
      }
    })

    /* sameArr.forEach((item, index) => {
      console.log('重复数据？')
      if (item === data.id) {
        msg.primary('数据一致，撤销失败')
        sameArr.splice(index, 1)
      }
    })
    console.log('pop',sameArr) */

    console.log('pop',differentArr)

    // currentRevertId.value = data.id

    /* if (differentArr.length === 0 ) {
      msg.primary('已回到最初始的数据')
      render()
      currentRevertId.value = null
      allShow.value = true
      const arr = handleExpand(node)
      expandKey.value = [...arr]
    } */


    /* const nativeName = revertData(node.level,data)
    if(category[data.id] != nativeName){
      const nativeName = revertData(node.level, data)
      data.name = nativeName
      category[data.id] = nativeName
      msg.primary('数据恢复成功')
      return;
    }else {
      msg.primary('数据一致，撤销失败')
      render()
      const arr = handleExpand(node)
      expandKey.value = [...arr]
    } */
    return;
  }


  if(isParentChild.value){
    handleParentRevert(node,data)
    return;
  }
  

    // 移除filter数据
    console.log('删除按钮',data.id)
    removeFilter(data.id)

    if(isNative.value){
      console.log('正常模式的删除')
    }else console.log('特殊模式的删除')

  console.log('filter-pop后',filterArr)

  // 新增还原数据的事件
  // 移除新增的子节点
  let afterCount
  afterCount = removeElement(node,data,true)


  

  // 如果一开始的长度跟后面新增的长度一致，说明没有新增的元素，则显示全部按钮
  if (beforeCount === afterCount) {
    msg.error('回到最原始的数据')
    disabledAddParent.value = false
    // t_reset：handleRevert初始化(新增模式)
    isDraggable.value = true
    const arr = handleExpand(node)
    expandKey.value = [...arr]
    // 启用复选框
    // enabledCheckboxes()
    allShow.value = true
  }
}

const  removeParentFilter  = (node,data) => {
  if (node.level > 1) {
    console.log('删除的是子节点')
    filterArr = filterArr.filter(item => item != data.id)
  } else {

    // 如果删除的父节点没有子节点
    if (node.level < 2 && node.isLeaf) {
      console.log('删除的父节点没有子节点')
      filterArr = filterArr.filter(item => item != data.id)
    } else {
      console.log('删除的父节点有子节点')
      // 提取子节点id
      const childrenId = node.data.children.map(item => item.id)
      // 将子节点id和父节点id合并
      const arr = [...childrenId,node.data.id]
      filterArr = filterArr.filter(item => !arr.includes(item))
    }
  }

}

const handleHasChild = (node) => {
  
  console.log("最终filterArr",filterArr)
  const childrenIds = findPrevSubCate()
  // 先判断有没有子节点，没有的话，就给isEnd赋值，否则有子节点，就给isChildId赋值
  if (childrenIds.length === 0) {
    console.log('没有子节点了')
    isHasChild.value = false
    isEnd.value = filterArr[filterArr.length - 1]
  } else {
    isHasChild.value = true
    isChildId.value = childrenIds[childrenIds.length - 1]
  }
  
  /* const isEndLeafParent = handleIsEndLeafParent(node,data)
  if(isEndLeafParent && isHasChild.value){
    isChildId.value = null
    isEndParent.value = true
  }else {
    isEndParent.value = false
    if(childrenIds.length && childrenIds.length > 0) {
      isChildId.value = childrenIds[childrenIds.length - 1]
    }
  } */
  

  // 处理菜单展开
  handleCollapse(node,isChildId.value)
}


const handleCollapse = (node,id) => {
  let childrenNodes
  if(node.level > 1){
    // 查找父节点对象
      childrenNodes = findParentNode(node.parent.parent.data,id)
    }else {
      childrenNodes = findParentNode(node.parent.data,id)
    }
    if(childrenNodes){
        // 查找父节点 node对象
        const parentNode = treeRef.value.getNode(childrenNodes)
        console.log("parentNode",parentNode)
          parentNode.expanded = true
      }
}


/**
 * 查找节点的父节点
 * @param {Array} data - 树的数据
 * @param {any} id - 目标节点的 id
 * @returns {Object|null} - 返回父节点或 null
 */
 function findParentNode(data, id) {
  for (const node of data) {
    if (node.children) {
      if (node.children.some(child => child.id === id)) {
        return node;
      }
      const parent = findParentNode(node.children, id);
      if (parent) {
        return parent;
      }
    }
  }
  return null;
}



const  handleIsEndLeafParent = (node,dta) => {
  const arr = node.level < 2 ?node.parent.data : node.parent.parent.data
  console.log('arr',arr)
 for (let i = 0; i < arr.length; i++) {
  if(i === arr.length -1){
      if(arr[i].children && arr[i].children.length > 0){
        console.log('返回false')
      }else {
        console.log('返回true')
      }
      return arr[i].children && arr[i].children.length > 0 ? false : true
    }
 }
  
}



const findPrevSubCate = () => {
  const children = []
  treeList.value.forEach((item) => {
      if(item.pid != -1){
        children.push(item.cate_id) 
      }
  })
  const childIds = filterArr.filter(item => children.includes(item))
  return childIds
}


const removeFilter = (id) => {
filterArr = filterArr.filter(item => item != id)

  filterArr.forEach((item,index) => {
    if(index === filterArr.length - 1){
      isEnd.value = item 
    }
  })
}

// t_current：控制按钮的禁用
const isDisabled = ref(true)

const handleDisabled = (data) => {
  if(data.flag === false){
    return false
  }else {
    if(isDisabled.value){
      return true
    }else {
      return false
    }
  }
}

// 定义延迟时间（毫秒）
const delay = 300

// 定义一个变量来存储定时器ID
let debounceTimer = null

const handleInput = (node,data) => {

    if(isParentChild.value){
      return
    }

     // 每次输入时，清除之前的定时器
     if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }

  // 设置一个新的定时器
  debounceTimer = setTimeout(() => {
    // 在这里可以添加你需要执行的逻辑，例如发送请求
    console.log('延迟后的输入内容:', category[data.id])
    if (isEdit.value) {

      const name = revertData(node.level, data)
      if (name != category[data.id]) {
        // 如果名字不重复，就不禁用确定按钮
        isDisabled.value = false
      } else {
        // 如果名字重复，就禁用确定按钮
        isDisabled.value = true
      }
      if (!category[data.id].trim()) {
        // 如果输入为空，就禁用确定按钮
        isDisabled.value = true
      }
    }
    // 清除定时器ID
    debounceTimer = null
  }, delay)


  

}


// 判断当前节点是否为最后一个子节点
const isLastChild = (node, data) => {
  if (!node.parent) return false
  const children = node.parent.data.children
  console.log('children',children)
  if (!children) return false
  return children.indexOf(data) === children.length - 1
}

// 判断子节点或父节点在当前节点是否都为最后一个
const isLastParentChild = (node, data) => {
  if (!node.parent) return false
  const children = data.isParent?node.parent.data:node.parent.data.children
  console.log('children',children)
  if (!children) return false
  return children.indexOf(data) === children.length - 1
}

//处理确定按钮的折叠
const showParent = (node,data) => {

    if(node.level < 2 ){
    const result = node.data.children.some(item => item.id === isChildId.value)

    if(result) {
      return node.expanded?false:true
    }else false

  }else {
      const parentNode = treeRef.value.getNode(node.parent.data)
      return parentNode.expanded?isChildId.value === data.id:false
  }
}

// 判断子节点或者父节点在所有节点是否都为最后一个
const isLastAll = (node, data) => {
  if(node.level < 2) {
    const children = node.parent.data
    return children.indexOf(data) === children.length-1
  }else {
    const children =  node.parent.parent.data
    let arr = [];
    children.forEach(item => {
      if(item.children && item.children.length > 0 ){
        item.children.forEach(item => {
          arr.push(item)
        })
      }
    })
    return arr.indexOf(data) === arr.length-1
  }
}


const handleLastParent = (node,data) => {
  if(node.level < 2 && isEndParent.value){
    const  parents = node.parent.data
    return parents.indexOf(data) === parents.length - 1 && node.isLeaf
  }
}


// t_handle：重置数据这样太麻烦，解决：kwq-inspiration-mount
const handleReset = () => {
  render()
  checkedIds.value = null
  disabledAddParent.value = false
  isDraggable.value = true
  allShow.value = true
  isCheckboxDisabled.value = false
  isParentChild.value = false
  isChild.value = false
  isEndParent.value = true
  isHasChild.value = false
  isEnd.value = null
  isLast.value = null
  isBig.value = false
  isChildId.value = null
  currentEditID.value = null
  isNormal.value = true
  isNative.value = true
  isReturn.value = false
  treeList.value = []
  differentArr.splice(0)
  filterArr.splice(0)
  // handleResetExpand()
  const arr = handleResetExpand()
  // console.log("arr",arr)
  expandKey.value = arr?[...arr]:[]
  msg.primary('重置成功')
}

const handleComment = () => {

  if(isParentChild.value){
    const arr = treeList.value.filter(item => item.pid === -1)
    if(arr.length > 1){
      return '按回车批量保存'
    }else return '按回车保存'
  }

  // 编辑模式
  if(isEdit.value){
     return Object.keys(category).length < 2 ? '按回车修改' : '按回车批量修改'
  }else {
  // 新增模式
    if(treeList.value.length >1){
    return '按回车批量保存'
  }else return '按回车保存'

  }
}

</script>

<style lang="scss" scoped>
// ============================================================
// 树形连接线：竖线+横线均在 .el-tree-node 上，每个节点独立定位
// ============================================================
:deep(.tree-with-line) {
  .el-tree-node {
    position: relative;
    width: fit-content;
    padding-left: 12px;

    // 竖直虚线 — 从节点顶部贯穿到底部
    &::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 0;
      height: 100%;
    }

    // 水平虚线 — 横跨 padding + icon 区域
    &::after {
      content: '';
      position: absolute;
      z-index: 0;
      left: 0;
      top: 12px;
      width: 20px;
      height: 0;
    }

    // 最后一个子节点：竖线截断，只保留顶部水平连接段
    &:last-child::before {
      height: 14px;
      top: 0;
      bottom: auto;
    }
  }

  .el-tree-node__content {
    position: relative;
    z-index: 1;
    padding-left: 0 !important;
  }

  .el-tree-node__children {
    padding-left: 12px;
  }

  // 防止按钮显示/隐藏时高度突变导致 label 文字抖动
  .custom-tree-node {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
  }

  // 节点右间距：父节点（展开/折叠一致）与叶子节点分别控制，均作用于 content
  /* .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content {
    padding-right: 75px;
  } */

  // 顶层叶子节点（配置管理、任务管理等无父节点包裹）→ 独立右间距
  > .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) > .el-tree-node__content {
    padding-right: 12px;
  }

  // 叶子节点（非顶层，有父节点包裹）→ 充满父容器
  /* .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) {
    width: 100%;
  } */

  // 展开图标 padding：父节点（展开/折叠一致）与叶子节点分别控制
  .el-tree-node__expand-icon:not(.is-leaf) {
    padding: 8px;
  }
  .el-tree-node__expand-icon.is-leaf {
    padding: 1px;
  }
}

// ============================================================
// 连接线样式：none / solid / dashed 由 configStore 动态切换
// ============================================================
:deep(.tree-line-none .el-tree-node) {
  &::before { border-left: none !important; }
  &::after  { border-top: none !important; }
}
:deep(.tree-line-solid .el-tree-node) {
  &::before { border-left: 1px solid var(--el-color-primary) !important; }
  &::after  { border-top: 1px solid var(--el-color-primary) !important; }
}
:deep(.tree-line-dashed .el-tree-node) {
  &::before { border-left: 1px dashed var(--el-color-primary) !important; }
  &::after  { border-top: 1px dashed var(--el-color-primary) !important; }
}

// ============================================================
// 节点宽度：content / fill / custom 由 configStore 动态切换
// ============================================================

// 父节点 — 内容宽
:deep(.tree-cate-parent-content .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content) {
  padding-right: 12px !important;
}

// 父节点 — 较大值（CSS 变量控制 px）
:deep(.tree-cate-parent-custom .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content) {
  padding-right: var(--tree-cate-parent-width, 75px) !important;
}

// 子节点 — 内容宽
:deep(.tree-cate-child-content .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) > .el-tree-node__content) {
  width: fit-content;
  padding-right: 14px !important;
}

// 子节点 — 占满
:deep(.tree-cate-child-fill .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf)){
  width: 100%;
}
</style>