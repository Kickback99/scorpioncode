import { h, defineComponent,onMounted } from "vue";
import { Icon as IconifyIcon, addIcon } from "@iconify/vue/dist/offline";
import { getIcon } from '@iconify/vue';

import Check from "@iconify-icons/ep/check";
import Bell from "@iconify-icons/ep/bell";
import { addSingleIcon } from "./iconifySingleOffilne";
import { useIconStore } from "@/store/icon";
addIcon("check", Check);
addIcon("bell", Bell);

const renderIcon = (icon) => {
  // console.log(getIcon(icon))
  addIcon(icon, getIcon(icon));
}


// Iconify Icon在Vue里本地使用（用于内网环境）
export default defineComponent({
  name: "SingleIcon",
  components: { IconifyIcon },
  props: {
    icon: {
      default: null
    },
    isCollect:{
      type: Boolean,
      default: true
    }
  },
    // t_store_icon：singleIcon.js(单个图标收集)
    // 存入store
  setup(props) {
    if (props.isCollect && props.icon) {
      const iconStore = useIconStore();
      onMounted(() => {
        // console.log('避免输出多次...')
        const uniqueIcons = new Set([
          ...iconStore.singleIcons,
          props.icon
        ]);
        iconStore.setSingleIcons([...uniqueIcons]);
      });
    }
  },
  render() {
    if (typeof this.icon === "object"){
      // console.log('是对象')
      addIcon(this.icon, this.icon);
    } 
    // 如果传入的图标中包含":"，则getIcon来离线加载图标
    /* if(this.icon?.includes(':')) {
      console.log('触发了')
      renderIcon(this.icon)
    } */
    // 如果传入的图标中包含":"，则调用函数来离线加载图标
    else if(this.icon?.includes(':')) {
      // console.log('是字符串')
       const data = getIcon(this.icon)
      // console.log('data',data)
      data!= null ? addIcon(this.icon, {...data}):addSingleIcon(this.icon)
    }
    const attrs = this.$attrs;
    return h(
      IconifyIcon,
      {
        icon: this.icon,
        style: attrs?.style
          ? Object.assign(attrs.style, { outline: "none" })
          : { outline: "none" },
        ...attrs
      },
      {
        default: () => []
      }
    );
  }
});
