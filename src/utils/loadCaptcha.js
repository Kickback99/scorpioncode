import { defineAsyncComponent } from 'vue'

// 按需懒加载验证码组件（缓存异步组件，仿管理端 loadPinyinMatch 的按需加载思路）
let cacheComponent = null

/**
 * 获取验证码异步组件（首次调用时才加载其 chunk）
 */
export function loadCaptchaComponent() {
  if (!cacheComponent) {
    cacheComponent = defineAsyncComponent(() => import('@/components/AppCaptcha.vue'))
  }
  return cacheComponent
}
