import { nextTick, watchEffect } from 'vue'
import { useConfigStore } from '@/store/config'
import { hasPerm } from '@/utils/permissions'

/**
 * v-perm 权限指令
 * 用法：<el-button v-perm="'btn.xx.xx'" ...> 或 <el-form-item v-perm="'btn.xx.xx'">
 * 无权限元素的展示方式由 configStore.buttonPermissionMode 全局决定：
 *   - 'hide'    → display:none（可逆，等价 v-show=false）
 *   - 'disable' → 原生 disabled + is-disabled class（按钮、输入框等表单控件）
 * 修饰符：v-perm.hide / v-perm.disable 强制隐藏/禁用（覆盖全局 buttonPermissionMode 配置，hide 优先）
 * 有权限时不做任何修改；指令只撤销自己做过的事，不覆盖模板自身的 :disabled 绑定。
 */

// 每个元素的指令状态（WeakMap：不污染元素、卸载后自动回收）
const stateMap = new WeakMap()

/** 修饰符强制模式：.hide → 'hide'，.disable → 'disable'，未指定 → null（跟随全局配置） */
const getForcedMode = (binding) => {
  if (binding.modifiers?.hide) return 'hide'
  if (binding.modifiers?.disable) return 'disable'
  return null
}

const FORM_CONTROL_SELECTOR = 'input, textarea, select'
const NATIVE_CONTROL_SELECTOR = 'input, textarea, select, button'

const isNativeControl = (el) => el.matches?.(NATIVE_CONTROL_SELECTOR)

/**
 * 收集需要禁用/恢复的控件。
 * 按钮、输入框直接作用于自身；容器节点作用于内部表单控件。
 */
function collectControls(el) {
  if (isNativeControl(el)) return [el]
  return Array.from(el.querySelectorAll(FORM_CONTROL_SELECTOR))
}

/**
 * 应用权限展示状态。
 * state.controlled 记录模板 :disabled 渲染出的基线，恢复时用基线还原，
 * 避免覆盖复合条件里业务部分的禁用状态。
 */
function apply(el, value) {
  const state = stateMap.get(el)
  if (!state) return // 已卸载

  // 修饰符强制模式优先（.hide / .disable），否则跟随全局 buttonPermissionMode 配置
  const mode = state.forcedMode || (useConfigStore().buttonPermissionMode || 'hide')

  // 先撤销指令上一轮的修改（隐藏/禁用互切、权限恢复都靠这里）
  if (state.hidden) {
    el.style.display = state.origDisplay
    state.hidden = false
    state.origDisplay = undefined
  }
  if (state.controlled.length) {
    state.controlled.forEach(({ el: control, baseDisabled }) => {
      control.disabled = baseDisabled
      control.classList.remove('is-disabled')
    })
    state.controlled = []
  }
  if (state.rootDisabledClass) {
    el.classList.remove('is-disabled')
    state.rootDisabledClass = false
  }

  if (hasPerm(value)) return // 有权限：恢复完即止

  if (mode === 'hide') {
    state.origDisplay = el.style.display
    state.hidden = true
    el.style.display = 'none'
  } else {
    const controls = collectControls(el)
    state.controlled = controls.map((control) => ({
      el: control,
      baseDisabled: control.disabled,
    }))
    controls.forEach((control) => {
      control.disabled = true
      control.classList.add('is-disabled')
    })

    // 容器类节点也打上禁用态，便于 el-form-item 等组件应用灰显样式
    if (!isNativeControl(el)) {
      el.classList.add('is-disabled')
      state.rootDisabledClass = true
    }
  }
}

export const setPerm = (app) => {
  app.directive('perm', {
    mounted(el, binding) {
      const state = {
        hidden: false,
        origDisplay: undefined,
        controlled: [],
        rootDisabledClass: false,
        forcedMode: getForcedMode(binding),
        stop: null,
      }
      stateMap.set(el, state)
      // 响应式核心：userPerm 或 buttonPermissionMode 任一变化立即重算。
      // 将来 WebSocket 推送权限 → setUserPerm 写入 → 此处自动触发。
      state.stop = watchEffect(() => apply(el, binding.value))
      nextTick(() => apply(el, binding.value))
    },
    updated(el, binding) {
      const state = stateMap.get(el)
      if (!state) return
      // 修饰符可能随模板更新变化，同步刷新
      state.forcedMode = getForcedMode(binding)
      // 子组件已按模板重新渲染，此刻控件 disabled 属性是模板最新值，刷新基线，
      // 避免恢复时把模板业务禁用条件（复合条件）覆盖成旧值
      state.controlled.forEach((c) => {
        c.baseDisabled = c.el.disabled
      })
      apply(el, binding.value)
    },
    unmounted(el) {
      const state = stateMap.get(el)
      if (state) {
        state.stop && state.stop()
        stateMap.delete(el)
      }
    },
  })
}
