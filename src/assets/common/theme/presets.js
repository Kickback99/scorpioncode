// ============================================================
// 主题色预设 — 每个语义色定义 bg（背景色）和 text（{ light, dark } 文字色）
// light-1~9 / dark-2 变体由 applyTheme() 自动从 bg 生成
// ============================================================

const W = '#f0f0f0', D = '#303133', WD = '#ffffff'
// W  = 浅色模式浅色字（微软白）
// D  = 浅色模式深色字（暗灰）
// WD = 深色模式浅色字（纯白，高对比）

export const themePresets = {
  default: {
    label: '默认蓝',
    colors: {
      primary: { bg: '#409EFF', text: { light: W, dark: WD } },
      success: { bg: '#67C23A', text: { light: W, dark: WD } },
      warning: { bg: '#E6A23C', text: { light: W, dark: WD } },
      danger:  { bg: '#F56C6C', text: { light: W, dark: WD } },
      info:    { bg: '#909399', text: { light: W, dark: WD } },
      chart: ['#409EFF','#67C23A','#E6A23C','#F56C6C','#5470C6','#91CC75','#FAC858','#EE6666','#73C0DE','#FC8452'],
    },
  },
  orange: {
    label: '活力橙',
    colors: {
      primary: { bg: '#E67E22', text: { light: W, dark: WD } },
      success: { bg: '#27AE60', text: { light: W, dark: WD } },
      warning: { bg: '#F39C12', text: { light: W, dark: WD } },
      danger:  { bg: '#E74C3C', text: { light: W, dark: WD } },
      info:    { bg: '#7F8C8D', text: { light: W, dark: WD } },
      chart: ['#E67E22','#27AE60','#F39C12','#E74C3C','#3498DB','#1ABC9C','#9B59B6','#F1C40F','#E67E22','#2ECC71'],
    },
  },
  pink: {
    label: '柔粉',
    colors: {
      primary: { bg: '#E91E63', text: { light: W, dark: WD } },
      success: { bg: '#4CAF50', text: { light: W, dark: WD } },
      warning: { bg: '#FF9800', text: { light: W, dark: WD } },
      danger:  { bg: '#F44336', text: { light: W, dark: WD } },
      info:    { bg: '#607D8B', text: { light: W, dark: WD } },
      chart: ['#E91E63','#4CAF50','#FF9800','#F44336','#2196F3','#00BCD4','#9C27B0','#FFEB3B','#FF5722','#8BC34A'],
    },
  },
  green: {
    label: '翠绿',
    colors: {
      primary: { bg: '#2ECC71', text: { light: D, dark: D } },
      success: { bg: '#1ABC9C', text: { light: W, dark: WD } },
      warning: { bg: '#F1C40F', text: { light: D, dark: D } },
      danger:  { bg: '#E74C3C', text: { light: W, dark: WD } },
      info:    { bg: '#95A5A6', text: { light: W, dark: WD } },
      chart: ['#2ECC71','#1ABC9C','#F1C40F','#E74C3C','#3498DB','#9B59B6','#E67E22','#1ABC9C','#F39C12','#27AE60'],
    },
  },
  purple: {
    label: '紫韵',
    colors: {
      primary: { bg: '#9B59B6', text: { light: W, dark: WD } },
      success: { bg: '#2ECC71', text: { light: D, dark: D } },
      warning: { bg: '#F39C12', text: { light: W, dark: WD } },
      danger:  { bg: '#E74C3C', text: { light: W, dark: WD } },
      info:    { bg: '#7F8C8D', text: { light: W, dark: WD } },
      chart: ['#9B59B6','#2ECC71','#F39C12','#E74C3C','#3498DB','#1ABC9C','#E67E22','#F1C40F','#E91E63','#00BCD4'],
    },
  },

  // ======== UI/UX Pro Max 行业配色 ========

  enterprise: {
    label: '企业蓝',
    colors: {
      primary: { bg: '#2563EB', text: { light: W, dark: WD } },
      success: { bg: '#16A34A', text: { light: W, dark: WD } },
      warning: { bg: '#EA580C', text: { light: W, dark: WD } },
      danger:  { bg: '#DC2626', text: { light: W, dark: WD } },
      info:    { bg: '#64748B', text: { light: W, dark: WD } },
      chart: ['#2563EB','#16A34A','#EA580C','#DC2626','#7C3AED','#0891B2','#D97706','#059669','#4F46E5','#DB2777'],
    },
  },

  coral: {
    label: '柔红',
    colors: {
      primary: { bg: '#F05454', text: { light: W, dark: WD } },
      success: { bg: '#10B981', text: { light: W, dark: WD } },
      warning: { bg: '#F59E0B', text: { light: D, dark: D } },
      danger:  { bg: '#DC2626', text: { light: W, dark: WD } },
      info:    { bg: '#64748B', text: { light: W, dark: WD } },
      chart: ['#F05454','#10B981','#F59E0B','#DC2626','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1'],
    },
  },

  warm: {
    label: '柠绿',
    colors: {
      primary: { bg: '#CDCD00', text: { light: D, dark: D } },
      success: { bg: '#16A34A', text: { light: W, dark: WD } },
      warning: { bg: '#EA580C', text: { light: W, dark: WD } },
      danger:  { bg: '#DC2626', text: { light: W, dark: WD } },
      info:    { bg: '#64748B', text: { light: W, dark: WD } },
      chart: ['#CDCD00','#16A34A','#EA580C','#DC2626','#2563EB','#7C3AED','#EC4899','#0891B2','#D97706','#059669'],
    },
  },

  aqua: {
    label: '海碧',
    colors: {
      primary: { bg: '#2DD4BF', text: { light: D, dark: D } },
      success: { bg: '#059669', text: { light: W, dark: WD } },
      warning: { bg: '#F59E0B', text: { light: D, dark: D } },
      danger:  { bg: '#DC2626', text: { light: W, dark: WD } },
      info:    { bg: '#64748B', text: { light: W, dark: WD } },
      chart: ['#2DD4BF','#059669','#F59E0B','#DC2626','#3B82F6','#8B5CF6','#EC4899','#F97316','#6366F1','#14B8A6'],
    },
  },

  indigo: {
    label: '鸢尾紫',
    colors: {
      primary: { bg: '#6366F1', text: { light: W, dark: WD } },
      success: { bg: '#059669', text: { light: W, dark: WD } },
      warning: { bg: '#F59E0B', text: { light: D, dark: D } },
      danger:  { bg: '#DC2626', text: { light: W, dark: WD } },
      info:    { bg: '#94A3B8', text: { light: D, dark: D } },
      chart: ['#6366F1','#059669','#F59E0B','#DC2626','#EC4899','#14B8A6','#F97316','#3B82F6','#8B5CF6','#E11D48'],
    },
  },
}

/** @type {Array<{name: string, label: string}>} */
export const themeList = Object.entries(themePresets).map(([name, preset]) => ({
  name,
  label: preset.label,
}))
