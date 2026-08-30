// src/data/elementIcons.js
import * as AllIcons from '@element-plus/icons-vue'

import elIcons from './elIcons'

// 定义需要的图标名称数组（只在这里定义一次）
/* const activeIcons = [
  'Edit',
  'Delete',
  'Refresh',
  'User',
  'Search',
  'Plus',
  'Baseball',
  'WarnTriangleFilled'
] */

// 导出图标对象（可选）
export const icons = Object.fromEntries(
  elIcons.map(name => [name, AllIcons[name]])
)

// 导出注册函数
export const registerIcons = (app) => {
  elIcons.forEach(name => {
    // console.log('注册图标:', name)
    app.component(name, AllIcons[name])
  })
}