import { useIconStore } from "@/store/icon";
/**
 * 通用分析函数
 */
export async function analyzeComponent(importPath) {
  try {
    // 导入原始文件内容
    const rawModule = await import(/*@vite-ignore*/ `${importPath}?raw`);
    const templateMatch = rawModule.default.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    const styleMatch = rawModule.default.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    
    console.log('正在分析的组件路径:', importPath);
    
    if (!templateMatch) {
      return false;
    }

    const template = templateMatch[1];
    const styleContent = styleMatch ? styleMatch[1] : '';
    
    let hasValidIcon = false;
    const svgIcons = [];
    const alibabaIcons = [];
    const elementIcons = [];
    
    // 1. 检查是否有符合条件的 icon 属性或 useRenderIcon
    hasValidIcon = checkValidIconUsage(template);
    
    // 2. 收集 SVG 图标
    collectSvgIcons(template, svgIcons);
    
    // 3. 收集阿里巴巴图标
    collectAlibabaIcons(template, styleContent, alibabaIcons);

    // 4. 收集 Element Plus 图标
    collectElementPlusIcons(rawModule.default, elementIcons, importPath);
    
    // 5. 立即保存所有图标到 store
    saveAllIconsToStore(svgIcons, alibabaIcons, elementIcons, importPath);
    
    console.log(`🎯 ${importPath} 分析结果:`, { 
      hasValidIcon, 
      svgCount: svgIcons.length, 
      alibabaCount: alibabaIcons.length,
      elementCount: elementIcons.length
    });
    
    return hasValidIcon;
    
  } catch (error) {
    console.warn(`⚠️ 无法分析组件 ${importPath}:`, error.message);
    return false;
  }
}


/**
 * 收集 Element Plus 图标
 */
function collectElementPlusIcons(content, elementIcons, importPath) {
  // 先移除注释内容
  const cleanContent = removeComments(content);
  const iconSet = new Set();
  
  // 使用确认能正常工作的正则表达式
  const iconPatterns = [
    // 1. 静态属性: icon="Edit", prefix-icon="Search"
    /(?:icon|active-icon|inactive-icon|prefix-icon|suffix-icon)="([^"]+)"/gi,
    
    // 2. 动态属性: :icon="Edit", :icon="'Search'"
    /(?:icon|active-icon|inactive-icon|prefix-icon|suffix-icon)=["']?([A-Z][A-Za-z0-9]*)["']?/g,
    
    // 3. el-icon 内的组件: <el-icon><Edit /></el-icon> 或 <el-icon><Edit></Edit></el-icon>
    /<el-icon[^>]*>[\s\S]*?<([A-Z][A-Za-z0-9]*)(?:\s[^>]*)?(?:\s*\/>|>[\s\S]*?<\/\1>)[\s\S]*?<\/el-icon>/gi,
    
    // 4. 直接使用的图标组件: <Edit /> 或 <Edit></Edit>
    /<([A-Z][A-Za-z0-9]+)(?:\s[^>]*)?(?:\s*\/>|>[\s\S]*?<\/\1>)/g,
    
    // 5. 动态组件: <component :is="Edit" />
    /<component[^>]*:is=["']?([A-Z][A-Za-z0-9]*)["']?[^>]*\/>/gi,
    
    // 6. 动态组件: <component is="Expand" />
    /<component[^>]*\sis=["']?([A-Z][A-Za-z0-9]*)["']?[^>]*>/gi,
    
    // 7. 三元表达式中的图标: :is="condition?'Top':'Bottom'"
    /:is=["'][^"']*\?["']?([A-Z][A-Za-z0-9]*)["']?:["']?([A-Z][A-Za-z0-9]*)["']?/gi
  ];

  // 应用所有正则模式
  iconPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanContent)) !== null) {
      // 处理多个捕获组的情况（如三元表达式）
      for (let i = 1; i < match.length; i++) {
        const iconName = match[i];
        if (iconName && isValidElementIconName(iconName)) {
          iconSet.add(iconName);
        }
      }
    }
  });

  const foundIcons = Array.from(iconSet);
  console.log(`🔍 ${importPath} 发现 Element Plus 图标:`, foundIcons);

  // 添加到当前文件的图标数组
  if (foundIcons.length > 0) {
    foundIcons.forEach(icon => {
      elementIcons.push({
        icon,
        files: [importPath]
      });
    });
  }
}


import elIcons from '@/data/elIcons';

/**
 * 验证 Element Plus 图标名的辅助函数 - 使用导入的白名单
 */
function isValidElementIconName(name) {
  if (!name) return false;
  
  // 使用导入的 Element Plus 图标白名单
  const elementIconWhitelist = elIcons;
  
  // 基本格式验证
  const isValidFormat = (
    /^[A-Z][A-Za-z0-9]*$/.test(name) && // 首字母大写，只包含字母数字
    name.length >= 3 && // 长度至少3个字符
    name.length <= 20 // 长度不超过20个字符
  );
  
  // 必须在白名单中
  const isInWhitelist = elementIconWhitelist.includes(name);
  
  const isValid = isValidFormat && isInWhitelist;
  
  if (!isValid) {
    if (isValidFormat) {
      console.log(`❌ 图标不在白名单中: ${name}`);
    } else {
      console.log(`❌ 图标格式无效: ${name}`);
    }
  } else {
    console.log(`✅ 验证通过: ${name}`);
  }
  
  return isValid;
}

/**
 * 移除注释的辅助函数
 */
function removeComments(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * 检查是否有符合条件的 icon 属性或 useRenderIcon
 * 如果标签不是 IconFont，且包含 icon 属性并且属性值首字符是小写，则返回 true
 * 避免与 Element Plus 图标起冲突
 */
function checkValidIconUsage(template) {
  // 1. 检查 useRenderIcon
  if (template.includes('useRenderIcon')) {
    return true;
  }
  
  // 2. 检查 icon 属性，但排除 IconFont 标签
  const iconMatches = template.matchAll(/<([^>]+)icon=(["'])([^"']*)\2[^>]*>/g);
  
  for (const match of iconMatches) {
    const tagContent = match[1];
    const iconValue = match[3];
    
    // 如果标签不是 IconFont，且包含 icon 属性并且属性值首字符是小写
    if (!tagContent.includes('IconFont') && iconValue && /^[a-z]/.test(iconValue)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 收集 SVG 图标
 */
function collectSvgIcons(template, svgIcons) {
  const svgIconMatches = template.matchAll(/<SvgIcon[^>]*name=(["'])([^"']*)\1[^>]*>/g);
  
  for (const match of svgIconMatches) {
    const fullTag = match[0];
    const name = match[2];
    
    // 提取 fill 属性
    const fillMatch = fullTag.match(/fill=(["'])([^"']*)\1/);
    const color = fillMatch ? fillMatch[2] : '';
    
    svgIcons.push({
      name,
      color
    });
    
    console.log(`🔍 发现 SVG 图标: ${name}`, color ? `[颜色: ${color}]` : '');
  }
}

/**
 * 收集阿里巴巴图标
 */
function collectAlibabaIcons(template, styleContent, alibabaIcons) {
  const iconFontMatches = template.matchAll(/<IconFont[^>]*>/g);
  
  for (const match of iconFontMatches) {
    const fullTag = match[0];
    
    // 提取 icon 属性
    const iconMatch = fullTag.match(/icon=(["'])([^"']*)\1/);
    if (!iconMatch) continue;
    
    const icon = iconMatch[2];
    let type = 'iconfont';
    let color = '';
    
    // 判断类型
    if (fullTag.includes('uni')) {
      type = 'uni';
    } else if (fullTag.includes('svg')) {
      type = 'svg';
    }
    
    // 提取颜色
    if (type === 'svg') {
      // SVG 类型：只找 fill 属性
      const fillMatch = fullTag.match(/fill=(["'])([^"']*)\1/);
      color = fillMatch ? fillMatch[2] : '';
    } else {
      // iconfont 和 uni 类型：先找 style 属性，再找 CSS 类
      const styleMatch = fullTag.match(/style=(["'])([^"']*)\1/);
      if (styleMatch) {
        const styleContent = styleMatch[2];
        const colorMatch = styleContent.match(/color:\s*([^;]+)/);
        color = colorMatch ? colorMatch[1].trim() : '';
      }
      
      // 如果 style 属性没有找到颜色，查找 .iconfont 类的颜色
      if (!color && styleContent) {
        const fontClassMatch = styleContent.match(/\.iconfont[^{]*{[^}]*color:\s*([^;]+)/);
        if (fontClassMatch) {
          color = fontClassMatch[1].trim();
        }
      }
    }
    
    alibabaIcons.push({
      type,
      icon,
      color
    });
    
    console.log(`🔍 发现阿里巴巴图标:`, { type, icon, color });
  }
}


/**
 * 保存所有图标到 store（立即保存，不依赖临时存储）
 */
function saveAllIconsToStore(svgIcons, alibabaIcons, elementIcons, importPath) {
  const iconStore = useIconStore();
  
  // 确保 store 已初始化
  if (!iconStore.svgIcons) iconStore.svgIcons = [];
  if (!iconStore.alibabaIcons) iconStore.alibabaIcons = [];
  if (!iconStore.elementIcons) iconStore.elementIcons = [];
  
  // 保存 SVG 图标（去重）
  if (svgIcons.length > 0) {
    const uniqueSvgIcons = [];
    const seen = new Set();
    
    svgIcons.forEach(icon => {
      const key = `${icon.name}-${icon.color}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSvgIcons.push(icon);
      }
    });
    
    // 合并到现有数据
    const allSvgIcons = [...iconStore.svgIcons, ...uniqueSvgIcons];
    const finalSvgIcons = [];
    const finalSeen = new Set();
    
    allSvgIcons.forEach(icon => {
      const key = `${icon.name}-${icon.color}`;
      if (!finalSeen.has(key)) {
        finalSeen.add(key);
        finalSvgIcons.push(icon);
      }
    });
    
    iconStore.svgIcons = finalSvgIcons;
    console.log(`💾 保存 SVG 图标:`, finalSvgIcons.length);
  }
  
  // 保存阿里巴巴图标（去重）
  if (alibabaIcons.length > 0) {
    const uniqueAlibabaIcons = [];
    const seen = new Set();
    
    alibabaIcons.forEach(icon => {
      const key = `${icon.type}-${icon.icon}-${icon.color}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAlibabaIcons.push(icon);
      }
    });
    
    // 合并到现有数据
    const allAlibabaIcons = [...iconStore.alibabaIcons, ...uniqueAlibabaIcons];
    const finalAlibabaIcons = [];
    const finalSeen = new Set();
    
    allAlibabaIcons.forEach(icon => {
      const key = `${icon.type}-${icon.icon}-${icon.color}`;
      if (!finalSeen.has(key)) {
        finalSeen.add(key);
        finalAlibabaIcons.push(icon);
      }
    });
    
    iconStore.alibabaIcons = finalAlibabaIcons;
    console.log(`💾 保存阿里巴巴图标:`, finalAlibabaIcons.length);
  }
  
  // 保存 Element Plus 图标（跨文件合并）
  if (elementIcons.length > 0) {
    console.log(`💾 合并 Element Plus 图标:`, elementIcons.length);
    
    // 创建临时 Map 来合并数据
    const iconMap = new Map();
    
    // 先添加现有数据到 Map
    iconStore.elementIcons.forEach(item => {
      iconMap.set(item.icon, [...item.files]);
    });
    
    // 合并新数据
    elementIcons.forEach(item => {
      if (iconMap.has(item.icon)) {
        // 合并文件数组（去重）
        const existingFiles = iconMap.get(item.icon);
        const newFiles = [...new Set([...existingFiles, ...item.files])];
        iconMap.set(item.icon, newFiles);
      } else {
        // 直接添加
        iconMap.set(item.icon, [...item.files]);
      }
    });
    
    // 转换回数组并按字母排序
    const mergedElementIcons = Array.from(iconMap, ([icon, files]) => ({
      icon,
      files: files.sort()
    })).sort((a, b) => a.icon.localeCompare(b.icon));
    
    iconStore.elementIcons = mergedElementIcons;
    console.log(`💾 最终 Element Plus 图标:`, mergedElementIcons.length);
  }
}

/**
 * 根据组件定义构建完整的导入路径
 */
export function getComponentImportPath(component) {
  if (typeof component === 'function') {
    const importPath = component.toString();
    const match = importPath.match(/import\("([^"]+)"\)/);
    if (match) {
      let path = match[1].replace(/^@\//, '/src/');
      path = path.replace(/\?t=\d+$/, '');
      return path;
    }
  } else if (component && component.__file) {
    const fullPath = component.__file;
    const srcIndex = fullPath.indexOf('src');
    if (srcIndex !== -1) {
      const relativePath = fullPath.substring(srcIndex).replace(/\\/g, '/');
      return `/${relativePath}`;
    }
  }
  
  return null;
}