<template>
         <div class="toolbar">
           <div class="toolbar-left">
             <el-button text size="small" @click="handleToggleExpand">
               <el-icon><component :is="tableExpanded ? 'Fold' : 'Expand'" /></el-icon> {{ tableExpanded ? '全部折叠' : '全部展开' }}
             </el-button>
             <el-button size="small" type="primary" v-perm="'btn.sysMenu.add'" @click="addDir" icon="Plus" plain>新增</el-button>
           </div>
           <SmartMenuSearch action-mode="expand" @expand-menu="handleExpandMenu" />
         </div>
        

        <!-- 表格 -->
        <el-table
        v-loading="loading"
        :data="tableData" style="width: 100%;"
        row-key="id"
        :tree-props="treeProps"
        ref="multipleTableRef"
        border stripe
        >
        <el-table-column prop="name" label="菜单名称" width="160"/>
        <el-table-column label="图标" width="60">
          <template #default="{row}">
            <!-- <Icon icon="row.icon == null ? 'ep:user':row.icon" /> -->
             <el-icon><SingleIcon :icon="row.icon"></SingleIcon></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" width="160"/>
        <el-table-column prop="path" label="路由地址" width="120"/>
        <el-table-column prop="component" label="组件路径" width="180" show-overflow-tooltip/>
        <el-table-column prop="sortValue" label="排序" width="60"/>
        <el-table-column label="状态" width="80">
            <template #default="{row}">
                <!-- <el-switch v-model="row.status"  :active-value="1" :inactive-value="0" @change="modifySwitch(row)"/> -->
                 <el-button size="small" type="success" v-if="row.status === 0" plain>启用</el-button>
                 <el-button size="small" type="danger" v-else plain>禁用</el-button>
            </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="200"/>
        <el-table-column label="操作" align="center">
          <template #default="{row}">
            <el-button size="small" type="primary" v-if="row.type !== 2" @click="addMenuButton(row)" v-perm="'btn.sysMenu.add'" plain>新增</el-button>
            <el-button size="small" type="warning" @click="editMenu(row)" v-perm="'btn.sysMenu.update'" plain>编辑</el-button>
            <el-popconfirm :title="`你确定要删除 ${row.name} 吗`" @confirm="removeMenu(row.id)" width="250px" icon="WarnTriangleFilled">
              <template #reference>
                <el-button size="small" type="danger" :disabled="row.children.length > 0" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
    </el-table>

    <!-- 弹层 -->
    <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="30%"
    @close="onCancel"
  >
  <el-form ref="dataForm" :model="formModel" label-width="150px" size="small" style="padding-right: 40px;">
          <el-form-item label="所属上级" v-if="formModel.parentName">
            <el-input v-model="formModel.parentName" disabled="true"/>
          </el-form-item>
          <el-form-item label="菜单类型" prop="type">
            <el-radio-group v-model="formModel.type" :disabled="typeDisabled">
              <el-radio :label="0" :disabled="type0Disabled">目录</el-radio>
              <el-radio :label="1" :disabled="type1Disabled">菜单</el-radio>
              <el-radio :label="2" :disabled="type2Disabled">按钮</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="菜单名称" prop="name">
            <el-input v-model="formModel.name"/>
          </el-form-item>
          <el-form-item label="图标" prop="icon" v-if="formModel.type !== 2">
<!--             <el-select v-model="formModel.icon" clearable>
              <el-option v-for="item in iconList" :key="item.class" :label="item.class" :value="item.class">
              <span style="float: left;">
               <i :class="item.class"></i>
              </span>
                <span style="padding-left: 6px;">{{ item.class }}</span>
              </el-option>
            </el-select> -->
            <!-- 菜单编辑时图标的显示问题，点击有图标在点击没有图标的菜单，图标不显示search(已解决) -->
            <IconSelect v-model="formModel.icon" ref="iconRef" class="w-[200px]" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="formModel.sortValue" controls-position="right" :min="0" />
          </el-form-item>
          <el-form-item prop="path">
                <template #label>
                路由地址
                  <el-tooltip content="访问的路由地址，如：`sysUser`" placement="top">
                    <el-icon>
                        <i-ep-questionFilled></i-ep-questionFilled>
                    </el-icon>
                  </el-tooltip>
                </template>
            <el-input v-model="formModel.path" placeholder="请输入路由地址" />
          </el-form-item>
          <el-form-item prop="component">
                <template #label>
                组件路径
                  <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                    <el-icon>
                        <i-ep-questionFilled></i-ep-questionFilled>
                    </el-icon>
                  </el-tooltip>
                </template>
            <el-input v-model="formModel.component" :disabled="isComponentDisabled " placeholder="请输入组件路径" />
          </el-form-item>
          <el-form-item v-if="formModel.type === 2">
            <el-input v-model="formModel.perms" placeholder="请输入权限标识" maxlength="100"/>
            <template #label>
                权限字符
                  <el-tooltip content="控制器中定义的权限字符，如：@PreAuthorize(hasAuthority('btn.sysUser.list'))" placement="top">
                  <el-icon>
                    <i-ep-questionFilled></i-ep-questionFilled>
                  </el-icon>
                  </el-tooltip>
            </template>
          </el-form-item>
          <el-form-item label="状态" prop="type">
            <el-radio-group v-model="formModel.status">
              <el-radio :label="0">正常</el-radio>
              <el-radio :label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button size="small" type="primary" @click="addOrModify" plain>确认</el-button>
        <el-button size="small" type="info" @click="onCancel" plain>
          取消
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { IconSelect } from "@/components/MyIcon";
import {listApi,addApi,modifyApi,removeApi} from '@/api/sysmenu'
const tableData = ref([])
import { isAllEmpty } from "@pureadmin/utils";
import { computed, nextTick, ref, watch } from 'vue';
const iconRef = ref()
const multipleTableRef = ref(null)
import {useUserStore} from '@/store/user'
import { loadMenu } from '@/router';
import msg from '@/components/msg'
import SmartMenuSearch from '@/views/components/SmartMenuSearch.vue'
import { findRowById, findByName } from '@/utils/tree'

const userStore = useUserStore()

// 默认关闭loading
const loading = ref(false)

// t_menu_request：菜单树形列表请求
const render = async() => {
     // 开启loading动效
     loading.value = true
     const res = await listApi()
     console.log(res)
     tableData.value = res.data
     // 关闭loading动效
     loading.value = false
}

render()

let highlightTimer = null

// ============================================================
// 展开/折叠
// ============================================================

/** 表格全部展开状态 */
const tableExpanded = ref(false)

/** 展开/折叠切换（递归遍历树形表格行） */
const handleToggleExpand = () => {
  const walk = (rows, expand) => {
    rows.forEach(row => {
      multipleTableRef.value?.toggleRowExpansion(row, expand)
      if (row.children?.length) walk(row.children, expand)
    })
  }
  tableExpanded.value = !tableExpanded.value
  walk(tableData.value, tableExpanded.value)
}

/**
 * 菜单搜索选中 → toggleRowExpansion 逐层展开祖先 → 滚动 + 高亮
 */
const handleExpandMenu = (item) => {
  const targetName = item.title || item.name

  const ancestorIds = []
  const found = findByName(tableData.value, targetName, ancestorIds)
  if (!found) return

  const targetId = ancestorIds[ancestorIds.length - 1]
  const isFirstRoot = tableData.value[0]?.id === targetId

  // 目标行还在高亮中 → 只检查滚动，其余跳过
  let alreadyHighlighted = false
  document.querySelectorAll('.menu-search-highlight').forEach(el => {
    if (el.querySelector('.el-table__cell')?.textContent?.trim() === targetName) {
      alreadyHighlighted = true
    }
  })
  if (alreadyHighlighted) {
    nextTick(() => scrollToTarget(targetName, isFirstRoot))
    return
  }

  const targetRow = findRowById(tableData.value, targetId)
  const expandIds = targetRow?.children?.length
    ? ancestorIds
    : ancestorIds.slice(0, -1)

  if (expandIds.length === 0) {
    nextTick(() => {
      scrollToTarget(targetName, isFirstRoot)
      highlightTarget(targetName)
    })
    return
  }

  let step = 0
  const expandNext = () => {
    if (step >= expandIds.length) {
      nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToTarget(targetName, isFirstRoot)
            highlightTarget(targetName)
          })
        })
      })
      return
    }
    const row = findRowById(tableData.value, expandIds[step])
    if (row) {
      multipleTableRef.value?.toggleRowExpansion(row, true)
    }
    step++
    nextTick(expandNext)
  }
  expandNext()
}

/** 滚动到目标行（第一个根节点不加偏移，其余用 scroll-margin-top 扣除工具栏高度） */
const scrollToTarget = (targetName, isFirstRoot = false) => {
  const bodyWrapper = document.querySelector('.el-table__body-wrapper')
  if (!bodyWrapper) return

  const rows = bodyWrapper.querySelectorAll('.el-table__row')
  for (const el of rows) {
    const firstCell = el.querySelector('.el-table__cell')
    if (firstCell?.textContent?.trim() === targetName) {
      if (isFirstRoot) {
        const wrap = document.querySelector('.main-scrollbar .el-scrollbar__wrap')
        if (wrap) wrap.scrollTop = 0
      } else {
        const toolbar = document.querySelector('.toolbar')
        const toolbarH = toolbar?.offsetHeight || 0
        el.style.scrollMarginTop = `${toolbarH + 20}px`
        el.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
      return
    }
  }
}

/** 高亮目标行（独立于滚动） */
const highlightTarget = (targetName) => {
  clearTimeout(highlightTimer)
  const prev = document.querySelector('.el-table__body-wrapper .menu-search-highlight')
  if (prev) prev.classList.remove('menu-search-highlight')

  const bodyWrapper = document.querySelector('.el-table__body-wrapper')
  if (!bodyWrapper) return

  const rows = bodyWrapper.querySelectorAll('.el-table__row')
  for (const el of rows) {
    const firstCell = el.querySelector('.el-table__cell')
    if (firstCell?.textContent?.trim() === targetName) {
      el.classList.add('menu-search-highlight')
      highlightTimer = setTimeout(() => {
        el.classList.remove('menu-search-highlight')
      }, 2500)
      return
    }
  }
}

// t_menu_request：删除菜单请求
const removeMenu = async(id) =>{
    await ElMessageBox.confirm('你确认要进行删除么','温馨提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await removeApi(id)
    msg.primary('删除成功')
    render()
}

// 批量删除相关
// const multipleSelection = ref([])

const treeProps = reactive({
  checkStrictly: false,
})

/* const removeMultiple = (raw) =>{
    console.log(raw)
    multipleSelection.value = raw
    // console.log(multipleSelection.value)
} */

/* const selectable = (row) => {
      return !row.children.length > 0
} */

// 批量删除
//批量删除菜单问题
/* const deleteSelectRows = () => {
    if(multipleSelection.value.length === 0){
        msg.error('请先勾选要删除的行')
        return
    }
    const rowIds = multipleSelection.value.map(row => row.id)
    removeMenu(rowIds)

} */

//  t_menu_request：更改菜单状态请求
/* const modifySwitch = async(row) =>{
    await statusApi(row.id,row.status)
    row.status === 1 ? msg.primary('菜单已激活'):msg.error('菜单已禁用')
    //t_question：菜单状态被禁用了，强制刷新路由
    window.location.reload()
} */

// 弹层相关

const dialogVisible = ref(false)
const title = ref('')

const defaultForm = {
    id: '',
    parentId: '',
    name: '',
    type: 0,
    path: '',
    component: '',
    perms: '',
    icon: '',
    sortValue: 1,
    status: 0
  }


const typeDisabled = ref(false) //控制以下是否全部禁用
const type0Disabled = ref(false) //目录
const type1Disabled = ref(false) //菜单
const type2Disabled = ref(false) //按钮

const formModel = ref({
    ...defaultForm
})


const AuthFields = ['Layout','ParentView','list']

const isComponentDisabled  = ref(false)



// 在工具条点击的添加按钮的事件
const addDir = () =>{
    // 添加为目录或菜单
    title.value = '添加目录/菜单'
    dialogVisible.value = true
    
    // 重置数据
    formModel.value = {...defaultForm}
    formModel.value.parentId = 0
    formModel.value.parentName = ''
    
    // 不禁用任何类型，让用户可以选择目录或菜单，只禁用按钮
    typeDisabled.value = false
    type0Disabled.value = false
    type1Disabled.value = false
    type2Disabled.value = true  // 禁用按钮选项
    
    // 默认选中目录类型
    formModel.value.type = 0
    formModel.value.component = 'Layout'  // 目录默认组件为Layout

    // 标记为工具条新增模式
    formModel.value._isToolbarAdd = true
    isComponentDisabled.value = true
}

// 监听类型变化
watch(
    () => formModel.value.type,
    (newType) => {
        // 仅在工具条新增模式且没有id（新增）且父级为0时执行
        if (formModel.value._isToolbarAdd && !formModel.value.id && formModel.value.parentId === 0) {
            formModel.value.component = newType === 0 ? 'Layout' : 'list'
            formModel.value.type = newType ===0 ? 0 : 1
            isComponentDisabled .value  = true
        }
    }
)

// 在表格中点击添加按钮的事件
const addMenuButton = (row) => {
    console.log(row)
    // 重置数据
    formModel.value = {...defaultForm}

    formModel.value.parentName = row.name 
    formModel.value.parentId = row.id
    dialogVisible.value = true
    title.value = '添加下级节点'
    isComponentDisabled .value = false
    
    if(row.type === 0){
        // 在目录中点击的添加，可以添加目录或菜单
        type2Disabled.value = true  // 禁用按钮
        typeDisabled.value = false   // 不禁用类型选择
        
        // 默认选中菜单类型
        formModel.value.type = 1
        formModel.value._isChildAdd = true  // 标记为子节点添加
    } else {
        // 在菜单中点击的添加，只能添加按钮
        typeDisabled.value = true
        formModel.value.type = 2
        formModel.value._isChildAdd = true // 标记为子节点添加
    }
}

// 添加监听处理子节点添加的类型变化
watch(() => formModel.value.type, (newType) => {
    // 子节点添加模式下的自动填充
    if (formModel.value._isChildAdd && !formModel.value.id) {
        if (newType === 0) {
            // 选择目录
            formModel.value.component = 'ParentView'
            isComponentDisabled .value  = true
        } else if (newType === 1) {
            // 选择菜单
            formModel.value.component = ''
            isComponentDisabled .value  = false
        } else if (newType === 2) {
            // 选择按钮
            formModel.value.component = ''
            isComponentDisabled .value  = false
        }
    }
})

// let baseIcon;

const editMenu = (row) =>{
    if (row.type === 0 || AuthFields.includes(row.component)){
      isComponentDisabled.value = true
    }else {
      isComponentDisabled.value = false
    }
    title.value = '修改菜单'
    dialogVisible.value = true
    console.log(row.type)
    nextTick(()=>{
      if(row.type != 2 && isAllEmpty(row.icon)){
      iconRef.value.removeIcon()
      // console.log(iconRef.value)
    }
    })
    console.log(row.icon)
    // baseIcon =  row.icon
    formModel.value =  {...row}
    typeDisabled.value = true
}

// 弹层取消事件
const onCancel = () => {
  dialogVisible.value = false
  delete formModel.value._isToolbarAdd
  delete formModel.value._isChildAdd
  isComponentDisabled.value = false  // 重置状态
  // formModel.value.icon = baseIcon
}

// 弹层确认事件：添加或修改
const addOrModify = () =>{
    delete formModel.value._isToolbarAdd
    delete formModel.value._isChildAdd
    isComponentDisabled.value = false  // 重置状态

    if(formModel.value.type === 0 && formModel.value.parentId != 0){
        formModel.value.component = 'ParentView'
    }
    if(!formModel.value.id){
        addMenu()
    }else modifyMenu()
}

// t_menu_request：菜单新增请求
const addMenu = async() => {
    await addApi(formModel.value)
    dialogVisible.value = false
    msg.primary('添加成功')
    loadMenu(false)
    render()
}

// t_menu_request：菜单修改请求

const modifyMenu = async() => {
    await modifyApi(formModel.value)
    dialogVisible.value = false
    msg.primary('修改成功')
    render()
    // 清空路由
    // clearRoute(userStore.userMenu)
    // 重新加载路由配置文件和pinia数据
    loadMenu(false)
}
</script>

<style lang="scss" scoped>
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        position: sticky;
        top: 0;
        z-index: 7;
        background: var(--el-bg-color);
        padding: 4px 0;
    }

    .toolbar-left {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* 搜索高亮 */
    :deep(.menu-search-highlight) > .el-table__cell {
      background-color: var(--el-color-primary-light-9) !important;
      transition: background-color 0.3s;
    }
</style>

<style lang="scss">
/* 深色模式搜索高亮：覆盖 scoped 的 primary-light-9 */
/* html.dark .menu-search-highlight > .el-table__cell {
  background-color: var(--el-color-primary-light-9) !important;
} */
html.dark .menu-search-highlight > .el-table__cell .cell {
  color: var(--el-color-info-dark-2) !important;
}
</style>