import { h, defineComponent} from "vue";
import { OnlineIcon, SingleIcon, IconFont } from "../index";

/**
 * 支持 `IconFont`、自定义 `svg` 以及 `iconify` 中所有的图标
 * @see 点击查看文档图标篇 {@link https://pure-admin.github.io/pure-admin-doc/pages/icon/}
 * @param icon 必传 图标
 * @param offline 布尔值，默认true为Offline，否则online
 * @param attrs 可选 iconType 属性
 * @returns Component
 */
export function useRenderIcon(icon,offline=true,attrs) {
  // IconFont
  const ifReg = /^IF-/;
  // typeof icon === "function" 属于SVG
  if (ifReg.test(icon)) {
    // IconFont
    const name = icon.split(ifReg)[1];
    const iconName = name.slice(
      0,
      name.indexOf(" ") == -1 ? name.length : name.indexOf(" ")
    );
    const iconType = name.slice(name.indexOf(" ") + 1, name.length);
    return defineComponent({
      name: "IconFont",
      render() {
        return h(IconFont, {
          icon: iconName,
          iconType,
          ...attrs
        });
      }
    });
  } else if (typeof icon === "function" || typeof icon?.render === "function") {
    // svg
    return attrs ? h(icon, { ...attrs }) : icon;
  } else if (typeof icon === "object") {
    return defineComponent({
      name: "OfflineIcon",
      render() {
        return h(SingleIcon, {
          icon: icon,
          ...attrs
        });
      }
    });
  } else {
    // 通过是否存在 : 符号来判断是在线还是本地图标，存在即是在线图标，反之
    return defineComponent({
      name: "Icon",
      render() {
        const IconifyIcon =
          icon && offline ?  SingleIcon : OnlineIcon
        return h(IconifyIcon, {
          icon: icon,
          ...attrs
        });
      }
    });
  }
}
