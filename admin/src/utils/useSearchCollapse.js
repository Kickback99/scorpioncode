import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingStore } from '@/setting'
import { useTabStore } from '@/store/tabs'

/**
 * 列表页搜索面板折叠状态
 *
 * 优先级：标签页已有偏好 → 用偏好（标签页关闭时偏好一并清除）；
 * 无偏好 → 用总开关「搜索面板折叠」。总开关在 ToolBar 里切换，
 * 切换时调用方会清空全部偏好，这里负责当前页即时归位。
 *
 * @returns {{ searchActiveNames: import('vue').Ref<string[]> }} 绑定到 el-collapse 的 v-model
 */
export function useSearchCollapse() {
    const settingStore = useSettingStore()
    const tabStore = useTabStore()
    const route = useRoute()

    const saved = tabStore.collapseStates[route.path]
    const searchActiveNames = ref(
        saved !== undefined ? saved : (settingStore.collapseSearchEnabled ? [] : ['search'])
    )

    // 用户手动展开/折叠 → 记住当前标签页偏好
    watch(searchActiveNames, (val) => {
        tabStore.setCollapseState(route.path, val)
    })

    // 总开关变更 → 当前页即时归位
    watch(() => settingStore.collapseSearchEnabled, (val) => {
        searchActiveNames.value = val ? [] : ['search']
    })

    return { searchActiveNames }
}
