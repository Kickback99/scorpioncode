import Learn from '@/test/Learn.vue';

// 需要图标收集的普通组件
export const plainComData = [
    {name:'hello',component:()=>import('@/utils/hello.vue')},
    {name:'practise',component:()=>import('@/test/Practise.vue')},
    {name:'learn',component:Learn}
]