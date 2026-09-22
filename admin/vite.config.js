import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import { getPlugins } from './plugins'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  // 获取各种环境下的对应的变量
  let env = loadEnv(mode,process.cwd())
  // 生产环境用 terser 剔除 console/debugger，其余环境（dev/local-cookie/test）保留日志
  const isProd = mode === 'production'
  return {
    //t_env：base
    base: env.VITE_BASE_URL,
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      // 手动拆包：把稳定第三方库拆成独立 chunk，配合 nginx immutable 缓存，发版后回访只重下变化的 app 包
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            echarts: ['echarts'],
            editor: ['@kangc/v-md-editor', 'prismjs', 'markdown-it', 'highlight.js'],
            // utils 被入口静态依赖，写进来的库会无条件进首屏 —— 懒加载的库（如 pinyin-match / cronstrue）不要放这
            utils: ['axios', 'crypto-js', 'nprogress', 'mitt'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    //配置代理
    server: {
      proxy: {
        // 把 /images 放在最前面，优先匹配
        '/images': {
          target: env.VITE_HOST,
          changeOrigin: true,
          // 确保转发时不丢失路径
          /* configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 代理转发 /scorpioncode/images:', req.url);
            });
          } */
        },
        // 文件图片预览（公开只读，顶级路径），本地开发直达后端
        '/resource/file/preview': {
          target: env.VITE_HOST,
          changeOrigin: true,
        },
        [env.VITE_API]: {
          target: env.VITE_HOST, // 后端服务器地址
          changeOrigin: true, // 是否改变请求域名
          rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API}`), '')//将原有请求路径中的api替换为''
        }
      },
    },
    // 依赖预构建白名单：提前声明「转换期才生成、预扫描发现不了」的依赖，
    // 否则 Vite 会在运行时才发现它们，触发重新预构建 + full-reload，把导航中的用户打回上一页
    optimizeDeps: {
      include: [
        // element-plus 按需样式入口：unplugin-vue-components 解析到组件时才注入，预扫描看不到
        'element-plus/es/components/*/style/css',
        // markdown 高亮语言包：prismjs 无 exports 字段，glob 会展开出全部 596 个语言包，故逐个列举
        'prismjs/components/prism-core',
        'prismjs/components/prism-json',
        'prismjs/components/prism-clike',
        'prismjs/components/prism-markup',
        'prismjs/components/prism-javascript',
        'prismjs/components/prism-java',
        'prismjs/components/prism-css',
        'prismjs/components/prism-bash',
        'prismjs/components/prism-yaml',
        'prismjs/components/prism-markdown',
        'prismjs/components/prism-sql',
        'prismjs/components/prism-typescript',
        'prismjs/components/prism-nginx',
        'prismjs/components/prism-docker',
      ],
    },
    // scss全局变量
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true,
          additionalData: '@import "./src/assets/style/global.scss";'
        }
      }
    },
    plugins: getPlugins()

  }

})