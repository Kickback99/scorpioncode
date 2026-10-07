import { h, defineComponent,onMounted } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";
import { useIconStore } from "@/store/icon";

// Iconify Icon在Vue里在线使用（用于外网环境）
export default defineComponent({
  name: "OnlineIcon",
  components: { IconifyIcon },
  props: {
    icon: {
      type: String,
      default: ""
    },
    isCollect:{
      type: Boolean,
      default: true
    }
  },
    // t_store_icon：onlineIcon.js(在线图标收集)
    // 存入store
  setup(props) {
    if (props.isCollect && props.icon) {
      const iconStore = useIconStore();
      onMounted(() => {
        // console.log('避免输出多次...')
        const uniqueIcons = new Set([
          ...iconStore.onlineIcons,
          props.icon
        ]);
        iconStore.setOnlineIcons([...uniqueIcons]);
      });
    }
  },
  render() {
    const attrs = this.$attrs;
    return h(
      IconifyIcon,
      {
        icon: `${this.icon}`,
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