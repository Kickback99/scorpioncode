import http from '@/utils/request'

export const helloApi = () => http.get("/hello")