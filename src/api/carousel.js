import http from '@/utils/http'

const API = {
    CAROUSEL_URL: '/user/content/carousel'
}

// 获取轮播图列表
export const getCarouselListApi = () => http.get(`${API.CAROUSEL_URL}/list`)