import { listIcons,getIcon } from '@iconify/vue';
import { addCollection, addIcon } from '@iconify/vue/dist/offline';
import { prefix as epPrefix, icons as epIcons } from '@iconify-json/ep/icons.json';
import { prefix as riPrefix, icons as rIIcons } from '@iconify-json/ri/icons.json';
import { prefix as fasPrefix, icons as fasIcons } from '@iconify-json/fa-solid/icons.json';
import { useIconStore } from '@/store/icon';

export function addBatchIconList(icons) {
    // console.log('批量加载调用了');

    // t_store_icon：iconifyBachOffline.js(所有批量图标)
    // 存入store
    const iconStore = useIconStore()
    iconStore.setBatchIcons([...icons])
    
    // 获取已存在的图标列表
    const existingIcons = listIcons();
    const newIconsMap = {}; // 按前缀分组的新图标
    const existingIconsToAdd = []; // 需要单独添加的已存在图标
    
    // 第一步：分类处理所有图标
        icons.forEach(fullName => {
        const [prefix, name] = fullName.split(':');
        
        // 先检查是否已存在
        if (existingIcons.includes(fullName)) {
            // 已存在 -> 从getIcon获取数据
            const iconData = getIcon(fullName);
            if (iconData) {
                existingIconsToAdd.push({ fullName, iconData });
            } /* else {
                console.warn(`图标 ${fullName} 已存在但获取失败`);
            } */
        } else {
            // 新图标 -> 从本地JSON获取数据
            const iconData = getIconData(prefix, name);
            if (!iconData) {
                // console.warn(`无法获取图标数据: ${fullName}`);
                return;
            }
            
            // 按前缀分组
            if (!newIconsMap[prefix]) {
                newIconsMap[prefix] = {
                    prefix,
                    icons: {}
                };
            }
            newIconsMap[prefix].icons[name] = iconData;
        }
    });
    
    // 第二步：批量添加新图标
    Object.values(newIconsMap).forEach(group => {
        if (Object.keys(group.icons).length > 0) {
            // console.log(`批量添加前缀 ${group.prefix} 的图标集`, group);
            addCollection(group);
        }
    });
    
    // 第三步：单独添加已存在的图标
    existingIconsToAdd.forEach(({ fullName, iconData }) => {
        // console.log(`单独添加已存在图标 ${fullName}`);
        addIcon(fullName, iconData);
    });
    
    // console.log('当前所有在线图标:', listIcons());
}

// 获取图标数据的函数保持不变
function getIconData(prefix, key) {
    let iconData;
    if (prefix === epPrefix) {
        iconData = epIcons[key];
        return iconData ? { ...iconData, width: 1024, height: 1024 } : null;
    } else if (prefix === riPrefix) {
        iconData = rIIcons[key];
        return iconData ? { ...iconData, width: 24, height: 24 } : null;
    } else if (prefix === fasPrefix) {
        iconData = fasIcons[key];
        if (!iconData) return null;
        return iconData.width ? iconData : { ...iconData, width: 1024, height: 1024 };
    }
    return null;
}