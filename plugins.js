import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'
import prismjs from 'vite-plugin-prismjs';
import svgLoader from 'vite-svg-loader'  // svg加载器

// pathSrc 是给自动导入图标库使用的
const pathSrc = path.relative(__dirname,'src')

export function getPlugins(){
    return [
        vue(),
        // svg组件
        createSvgIconsPlugin({
          iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
          symbolId: 'icon-[dir]-[name]',
          svgoOptions:{
            // 删除填充的属性
            plugins:[
              {
                name:'removeAttrs',
                params:{attrs:["class","data-name","fill","stroke"]}
              }
            ]
          }
        }),
        svgLoader(),  // 添加 SVG 加载器
        prismjs({
          languages:['json','js','java','xml','html','css','bash','ts', 'sql', 'yaml', 'nginx','markdown','nginx','docker','shell']
        }),
        //element plus 自动导入插件
        AutoImport({
          // 自动导入 Vue 和 Vue-router 相关函数，如 ref, reactive, createRouter 等
          imports:['vue','vue-router'],
          resolvers: [ElementPlusResolver()],
        }),
        Components({
          resolvers: [
            // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
            ElementPlusResolver(),
            // 自动导入图标组件
            IconsResolver({
              // prefix: 'i', 默认为i，所以可以不用声明
              enabledCollections:['ep','ant-design'] //指定图标集合，@iconify-json/ep 是 Element plus 的图标库
    
          }),
          ],
          dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
        }),
    
        // 开启Icons图标自动下载
        Icons({
          autoInstall: true,
        }),
    ]
}