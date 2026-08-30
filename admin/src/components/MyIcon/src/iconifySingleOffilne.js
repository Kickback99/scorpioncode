import { addIcon } from "@iconify/vue/dist/offline";
import {prefix as epPrefix,icons as epIcons} from '@iconify-json/ep/icons.json'
import {prefix as riPrefix,icons as rIIcons} from '@iconify-json/ri/icons.json'
import {prefix as fasPrefix,icons as fasIcons} from '@iconify-json/fa-solid/icons.json'

// 单个图标动态加载
export const addSingleIcon = (icon) => {
    const [prefix, key] = icon.split(':');
    // console.log(getIconData(prefix,key))
    // console.log('离线加载中')
    addIcon(icon,getIconData(prefix,key))
}

// 假设有一个函数来获取图标数据
function getIconData(prefix, key) {
  let iconData;
  // 返回一个新对象，新对象都保留原始数据
  // 如果匹配的是epPrefix，添加宽高属性为1024
  if (prefix === epPrefix) {
    iconData = epIcons[key];
    if (iconData) {
      return {
        ...iconData,
        width: 1024,
        height: 1024
      };
    }
    // 如果匹配的是riPrefix，添加宽高属性为24
  } else if (prefix === riPrefix) {
    iconData = rIIcons[key];
    if (iconData) {
      return {
        ...iconData,
        width: 24,
        height: 24
      };
    }
    //如果匹配的是fasPrefix，就判断fasIcons[key]有没有宽属性，如果有则不添加宽高，如果没有宽属性则添加宽高
  } else if (prefix === fasPrefix) {
    iconData = fasIcons[key];
    if (iconData) {
      // 检查fasIcons[key]是否有width属性
      if (!iconData.width) {
        return {
          ...iconData,
          width: 1024,
          height: 1024
        };
      } else {
        // 如果fasIcons[key]已经有width属性，则不添加宽高
        return iconData;
      }
    }
  }

  // 如果没有匹配到任何前缀，或者图标数据不存在，则返回null
  return null; // 或者根据需求返回其他值或抛出错误
}