import { useUserStore } from "@/store/user"
import { useConfigStore } from "@/store/config"

/**
 * 判断当前用户是否拥有指定权限
 * 语义修正：有权限返回 true（旧 hasPermissions 语义相反，已彻底移除）
 * 注意：内部依赖 Pinia store，只能在组件 setup / 指令钩子等运行时调用
 */
export const hasPerm = (permissions) => {
    const store = useUserStore()
    return store.userPerm.includes(permissions)
}

/**
 * 判断操作列是否显示
 * hide 模式下：列内所有权限按钮都不命中 → 隐藏整列（避免空列）
 * disable 模式下：始终显示（灰按钮提示"此处有操作"）
 * @param {string[]} perms — 列内全部 v-perm 按钮的权限 key
 */
export const showPermColumn = (perms) => {
    if (useConfigStore().buttonPermissionMode !== 'hide') return true
    const store = useUserStore()
    return perms.some((p) => store.userPerm.includes(p))
}
