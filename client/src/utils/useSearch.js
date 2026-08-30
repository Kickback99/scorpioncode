import { useRouter } from 'vue-router'

export function useSearch() {
  const router = useRouter()

  // 统一的搜索跳转逻辑
  const triggerSearch = (type, param) => {
    router.push({
      path: '/',
      query: { type, param }
    })
  }

  return { triggerSearch }
}