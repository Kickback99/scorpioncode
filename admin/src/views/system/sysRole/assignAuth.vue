<template>
    <div class="app-container">
      <!-- ===== 展开/折叠工具栏 + 授权角色（sticky 固定） ===== -->
      <div class="auth-header" :class="{ 'page-theme': settingStore.pageTheme }">
        <div class="auth-toolbar">
          <el-button text size="small" @click="handleToggleExpand">
            <el-icon><component :is="treeExpanded ? 'Fold' : 'Expand'" /></el-icon> {{ treeExpanded ? '全部折叠' : '全部展开' }}
          </el-button>
          <SmartMenuSearch action-mode="expand" @expand-menu="handleExpandMenu" />
        </div>
        <div style="margin: 10px 0;">
          授权角色：{{ route.query.roleName }}
        </div>
      </div>
      <el-tree
        class="tree-with-line"
        :class="[lineClass, authChildClass, { 'page-theme': settingStore.pageTheme }]"
        style="margin: 12px 0"
        ref="treeRef"
        :data="sysMenuList"
        node-key="id"
        show-checkbox
        :props="defaultProps"
      />
      <div style="padding: 20px 20px;">
        <el-button size="small" type="primary" :loading="loading" @click="save" plain>保存</el-button>
        <el-button size="small" type="info" @click="$router.push('/system/sysRole')" plain>返回</el-button>
      </div>
    </div>
  </template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { allocMenusApi, doAllocMenusApi } from '@/api/sysmenu';
import { useConfigStore } from '@/store/config';
import SmartMenuSearch from '@/views/components/SmartMenuSearch.vue'
import { findRowById, findByName } from '@/utils/tree'

const configStore = useConfigStore()
const lineClass = computed(() => `tree-line-${configStore.getTreeAuthLineStyle()}`)
const authChildClass = computed(() => `tree-auth-child-${configStore.getTreeAuthChildMode()}`)
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user';
import { useSettingStore } from '@/setting'
import { clearRoute } from '@/utils/remove';
import { loadMenu } from '@/router';
import msg from '@/components/msg'
const route = useRoute()
const router = useRouter()
const settingStore = useSettingStore()

const props = defineProps({
  id: String,
});

const loading = ref(false);
const sysMenuList = ref([]);
const treeRef = ref(null);
const defaultProps = {
  children: 'children',
  label: 'name',
};

//t_role_request: 获取角色菜单数据请求
const render = async () => {
    const roleId = route.query.id
    if (!roleId) {
      return
    }
    const result = await allocMenusApi(roleId);
    sysMenuList.value = result.data;
    await nextTick()
    const checkedIds = getCheckedIds(sysMenuList.value);
    // console.log('getPermissions() checkedIds', checkedIds);
    treeRef.value?.setCheckedKeys(checkedIds)
};

render()

// 组件复用时（同一路由不同 query），自动重新请求
watch(() => route.query.id, () => { if (route.query.id) render() })

// 得到所有选中的id列表（递归收集所有 select 为 true 的叶子节点）
const getCheckedIds = (auths) => {
    const ids = []
    const walk = (nodes) => {
      nodes.forEach(item => {
        if (item.select && item.children.length === 0) {
          ids.push(item.id)
        } else if (item.children && item.children.length > 0) {
          walk(item.children)
        }
      })
    }
    walk(auths)
    return ids
};

// ============================================================
// 展开/折叠
// ============================================================

/** 树展开状态（响应式切换图标 + 文字） */
const treeExpanded = ref(false)

/** 展开/折叠切换 */
const handleToggleExpand = () => {
  if (treeExpanded.value) {
    handleCollapseAll()
  } else {
    handleExpandAll()
  }
  treeExpanded.value = !treeExpanded.value
}

/** 全部展开 */
const handleExpandAll = () => {
  const nodes = treeRef.value?.store?.nodesMap || {}
  Object.values(nodes).forEach(node => { node.expanded = true })
}

/** 全部折叠 */
const handleCollapseAll = () => {
  const nodes = treeRef.value?.store?.nodesMap || {}
  Object.values(nodes).forEach(node => { node.expanded = false })
}

let highlightTimer = null
let loadingTimer = null

/**
 * 菜单搜索选中 → 祖先骨架屏 → 逐层展开 → 揭开 → 滚动高亮
 */
const handleExpandMenu = (item) => {
  const targetName = item.title || item.name

  const ancestorIds = []
  const found = findByName(sysMenuList.value, targetName, ancestorIds)
  if (!found) return

  const targetId = ancestorIds[ancestorIds.length - 1]

  // 已展开 + 还在高亮中 → 只检查滚动，其余跳过
  const ancestorsExpanded = ancestorIds.slice(0, -1).every(id => {
    const node = treeRef.value?.store?.nodesMap[id]
    return node?.expanded
  })
  const isHighlighted = !!document.querySelector(`.el-tree-node[data-key="${targetId}"].menu-search-highlight`)
  if (ancestorsExpanded && isHighlighted) {
    nextTick(() => scrollToTarget(targetName))
    return
  }

  const targetRow = findRowById(sysMenuList.value, targetId)
  const expandIds = targetRow?.children?.length
    ? ancestorIds
    : ancestorIds.slice(0, -1)

  if (expandIds.length === 0) {
    nextTick(() => {
      scrollToTarget(targetName)
      highlightTarget(targetName)
    })
    return
  }

  clearTimeout(loadingTimer)
  removeTreeLoading()

  const treeEl = document.querySelector('.tree-with-line')

  /** 尝试对某节点加骨架屏（仅当它已在 DOM 中） */
  const tryAddSkeleton = (id) => {
    const nodeEl = treeEl?.querySelector(`.el-tree-node[data-key="${id}"]`)
    const content = nodeEl?.querySelector('.el-tree-node__content')
    if (content) content.classList.add('tree-node-loading')
  }

  // 逐层展开：每层先加骨架屏再展开，子节点进入 DOM 后下一轮再加
  let step = 0
  const expandNext = () => {
    if (step >= expandIds.length) {
      // 展开完成 → 立即滚动 → 骨架屏 1.2s → 揭开 + 高亮
      nextTick(() => scrollToTarget(targetName))
      loadingTimer = setTimeout(() => {
        removeTreeLoading()
        highlightTarget(targetName)
      }, 1200)
      return
    }
    tryAddSkeleton(expandIds[step])
    const node = treeRef.value?.store?.nodesMap[expandIds[step]]
    if (node) node.expanded = true
    step++
    nextTick(expandNext)
  }
  expandNext()
}

/** 移除所有骨架屏 */
const removeTreeLoading = () => {
  document.querySelectorAll('.tree-node-loading').forEach(el => el.classList.remove('tree-node-loading'))
}

/** 滚动到目标节点（距 sticky 头部下方 10px） */
const scrollToTarget = (targetName) => {
  const treeEl = document.querySelector('.tree-with-line')
  if (!treeEl) return

  const nodes = treeEl.querySelectorAll('.el-tree-node')
  for (const el of nodes) {
    const label = el.querySelector('.el-tree-node__label')
    if (label?.textContent?.trim() === targetName) {
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
      const wrap = el.closest('.el-scrollbar__wrap')
      if (wrap) {
        const header = document.querySelector('.auth-header')
        const headerH = header?.offsetHeight || 0
        wrap.scrollTop = Math.max(0, wrap.scrollTop - headerH - 10)
      }
      return
    }
  }
}

/** 高亮目标节点（骨架屏揭开后调用，独立于滚动） */
const highlightTarget = (targetName) => {
  clearTimeout(highlightTimer)
  const prev = document.querySelector('.tree-with-line .menu-search-highlight')
  if (prev) prev.classList.remove('menu-search-highlight')

  const treeEl = document.querySelector('.tree-with-line')
  if (!treeEl) return

  const nodes = treeEl.querySelectorAll('.el-tree-node')
  for (const el of nodes) {
    const label = el.querySelector('.el-tree-node__label')
    if (label?.textContent?.trim() === targetName) {
      el.classList.add('menu-search-highlight')
      highlightTimer = setTimeout(() => {
        el.classList.remove('menu-search-highlight')
      }, 2500)
      return
    }
  }
}

const userStore = useUserStore()

//t_role_request: 为角色分配菜单请求
const save = async () => {
    // 获得当前所有选中包括上级所组成的数组
    const allCheckedNodes = treeRef.value.getCheckedNodes(false, true)
    // console.log('selectedArr',allCheckedNodes)
     // 获得当前所有选中包括上级所组成的ids
    let idList = allCheckedNodes.map(node => node.id);
    // console.log('selectedIds',idList)
    let assignMenuVo = {
          roleId: route.query.id,
          menuIdList: idList
        }
    await doAllocMenusApi(assignMenuVo)
    loading.value = true
    msg.primary('分配权限成功')
    router.push('/system/sysRole')
    /* if(userStore.userInfo.id != 1){
        // 清空路由
        clearRoute(userStore.userMenu)
        // 重新加载路由配置文件和pinia数据
        try {
          await loadMenu(false)
        } catch (error) {
          msg.primary(error)
          //重新加载菜单方式一
          router.push('/')
          userStore.removeUserAuth()

          //重新加载菜单方式二
          router.push('/').then(()=>{
            window.location.reload()
          })
        }
    } */

};

</script>

<style lang="scss" scoped>
// ============================================================
// 授权菜单树
// ============================================================
.auth-header {
  position: sticky;
  top: 0;
  z-index: 7;
  padding: 4px 0;
}

.auth-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

// ============================================================
// 骨架屏：祖先节点展开时的闪烁动画
// ============================================================
:deep(.tree-node-loading) {
  position: relative;
  overflow: hidden;
  border-radius: 4px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--skeleton-shimmer) 40%,
      var(--skeleton-shimmer) 50%,
      var(--skeleton-shimmer) 60%,
      transparent 100%
    );
    animation: tree-shimmer 1.5s ease-in-out infinite;
  }
}

@keyframes tree-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

// ============================================================
// 搜索高亮：独立 class，不受 index.scss is-current 排它规则影响
// ============================================================
:deep(.menu-search-highlight) > .el-tree-node__content {
  background-color: var(--el-tree-node-hover-bg-color) !important;
  border-radius: 4px;
  transition: background-color 0.3s;
}
// 高亮边框跟随树连接线样式（与 index.scss hover 风格一致）
:deep(.tree-line-solid .menu-search-highlight) > .el-tree-node__content {
  outline: 1px solid var(--el-color-primary);
  outline-offset: -1px;
}
:deep(.tree-line-dashed .menu-search-highlight) > .el-tree-node__content {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: -1px;
}

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

    // 水平虚线 — width 24px 横跨 padding + icon 区域
    // 父节点：可见 icon 盖住 content 内部分，视觉上只露 padding 段
    // 叶子节点：icon 为 visibility:hidden 不渲染，横线穿透直达复选框
    // hover 时 __content 背景 (z-index:1) 自动盖住越界部分
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

  // 节点右间距：父节点按 __children 嵌套深度递进（每层 +4px），叶子节点固定 16px
  // depth 0 顶层父节点 → 24px
  .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content {
    padding-right: 62px;
  }
  // depth 1 → 20px（specificity 高一阶，覆盖 depth 0）
  .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content {
    padding-right: 38px;
  }
  // depth 2 → 16px
  .el-tree-node__children .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content {
    padding-right: 14px;
  }
  // depth 3 → 12px
  /* .el-tree-node__children .el-tree-node__children .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon:not(.is-leaf)) > .el-tree-node__content {
    padding-right: 12px;
  } */

  // 叶子节点（非顶层，有父节点包裹）→ 充满父容器
  /* .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) {
    width: 100%;
  } */
   
  /* .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) > .el-tree-node__content {
    padding-right: 16px;
  } */
   
  // 顶层叶子节点（配置管理、任务管理等无父节点包裹）→ 独立右间距
  > .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) > .el-tree-node__content {
    padding-right: 76px;
  }

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
// 子节点宽度：content / fill 由 configStore 动态切换
// ============================================================

// 子节点 — 内容宽
:deep(.tree-auth-child-content .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf) > .el-tree-node__content){
  width: fit-content;
  padding-right: 14px !important;
}

// 子节点 — 占满（默认，无需覆盖）
:deep(.tree-auth-child-fill .el-tree-node__children .el-tree-node:has(> .el-tree-node__content > .el-tree-node__expand-icon.is-leaf)){
    width: 100%;
}
</style>
