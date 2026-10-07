import { h, defineComponent,onMounted,ref,watch } from "vue";
import { Icon as IconifyIcon, addIcon } from "@iconify/vue/dist/offline";

import Check from "@iconify-icons/ep/check";
import Bell from "@iconify-icons/ep/bell";
import { addSingleIcon } from "./iconifySingleOffilne";
import { useIconStore } from "@/store/icon";
addIcon("check", Check);
addIcon("bell", Bell);

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
    // 图标集按前缀懒加载：本地没有该图标时异步拉取，到位后 bump 版本号触发重渲染
    //（离线 storage 是普通对象，addIcon 不触发响应式更新）
    const lazyIconVersion = ref(0)
    watch(() => props.icon, async (icon) => {
      if (typeof icon !== 'string' || !icon.includes(':')) return
      if (await addSingleIcon(icon)) lazyIconVersion.value++
    }, { immediate: true })

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

    return { lazyIconVersion }
  },
  render() {
    // 订阅懒加载版本号，图标集异步到位后重渲染
    void this.lazyIconVersion
    if (typeof this.icon === "object"){
      // console.log('是对象')
      addIcon(this.icon, this.icon);
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
