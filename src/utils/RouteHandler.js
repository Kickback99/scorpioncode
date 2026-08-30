import { routes } from "@/router"
import { useUserStore } from "@/store/user"

// 获取动态路由组件 (重构后的版本)
export function getDynamicRouteComponents(excludes = []) {
  const userStore = useUserStore()
  const menuData = userStore.userMenu
  
  // 递归扁平化路由树
  const flattenRoutes = (routes) => {
    return routes.flatMap(route => {
      const components = []

      // 检查是否在排除列表中
      const shouldExclude = excludes.includes(route.name)
      
      // 添加当前路由组件 (排除Layout组件和指定名称的组件)
      if (route.component && route.component.__name !== 'Layout' && !shouldExclude) {
        components.push({
          path: route.path,
          name: route.name,
          component: route.component
        })
      }
      
      // 递归处理子路由
      if (route.children && !shouldExclude) {
        components.push(...flattenRoutes(route.children))
      }
      
      return components
    })
  }
  
  // 获取扁平化后的路由组件
  const flatComponents = flattenRoutes(menuData)
  
  // 转换为目标格式
  return convertToDesiredFormat(flatComponents)
}

// 转换格式函数
const convertToDesiredFormat = (components) => {
  return components.map(item => ({
    path: item.path,
    name: item.name ? item.name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-') : 'index',
    component: item.component
  }))
}


// 获取本地路由组件
export function getLocalRouteComponents(excludes = []) {
  return routes.flatMap(route => {
    // 1. 主路由排除检查
    if (excludes.includes(route.name)) {
      return []; // 如果主路由被排除，直接返回空数组（包括它的所有子路由）
    }
    
    const components = [];
    
    // 添加主路由组件
    if (route.component && route.path !== '/') {
      components.push({
        name: generateNameFromPath(route.path),
        path: route.path,
        component: route.component,
        isLocal: true
      });
    }
    
    // 添加子路由组件
    if (route.children) {
      route.children.forEach(child => {
        // 2. 子路由排除检查
        if (!excludes.includes(child.name) && child.component) {
          components.push({
            name: generateNameFromPath(child.path),
            path: child.path,
            component: child.component,
            isLocal: true
          });
        }
      });
    }
    
    return components;
  });
}




export function generateNameFromPath(path) {
  // 去掉首尾斜杠
  let cleanedPath = path.replace(/^\/|\/$/g, '')

  // 判断是否包含多个斜杠
  if (path.split('/').length > 2) {
    // 多个斜杠的情况：替换中间斜杠为短横线
    return cleanedPath.replace(/\//g, '-')
  }

  console.log('cleanedPath',cleanedPath)

  // 单个斜杠的情况：直接返回去掉首尾斜杠的结果
  return cleanedPath
}

// ============================================================
// 菜单展平 — 递归提取所有路由 path
// ============================================================

/** 递归展平菜单树，返回所有完整路由 path 的 Set（用于标签页校验） */
export function flattenMenuPaths(menuData) {
  const paths = new Set()
  function walk(nodes, parentPath) {
    if (!nodes || !nodes.length) return
    nodes.forEach(node => {
      // 拼接完整路径：父路径 + '/' + 节点 path/name
      const fullPath = parentPath ? parentPath + '/' + (node.path || node.name || '') : (node.path || '')
      if (fullPath) paths.add(fullPath)
      if (node.children) walk(node.children, fullPath)
    })
  }
  walk(menuData, '')
  return paths
}