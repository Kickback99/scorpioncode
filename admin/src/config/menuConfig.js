// 在单独的菜单配置文件中 menuConfig.js
export const tempMenuConfig = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1
  return {
    path: `/temp${index}`,
    name: `temp${index}`,
    title: `模板页面 ${index}`,
    icon: 'Document'
  }
})