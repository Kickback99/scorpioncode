import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import prismjs from 'vite-plugin-prismjs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 获取各种环境下的对应的变量
  let env = loadEnv(mode, process.cwd())
  // 生产环境用 terser 剔除 console/debugger，其余环境（dev/local-cookie/test）保留日志
  const isProd = mode === 'production'
  return {
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
            vuetify: ['vuetify'],
            editor: ['@kangc/v-md-editor', 'marked', 'prismjs', 'markdown-it', 'highlight.js'],
            utils: ['axios', 'mitt'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['markdown-it-toc-done-right'] // 明确排除这个包
    },
    plugins: [
      // 生产环境预连接后端域名，本地/test 环境不注入（避免误连生产域名）
      {
        name: 'inject-preconnect',
        transformIndexHtml(html) {
          if (isProd && env.VITE_HOST) {
            return {
              html,
              tags: [
                { tag: 'link', attrs: { rel: 'preconnect', href: env.VITE_HOST }, injectTo: 'head-prepend' },
              ],
            }
          }
          return html
        },
      },
      vue(),
      vuetify({
        autoImport: true,  // 必须启用自动导入
        styles: { configFile: 'src/assets/styles/variables.scss' },// 可选，用于自定义变量
      }),
      prismjs({
        languages: ['json', 'xml', 'java', 'js'],
      }),
    ],
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
        [env.VITE_API]: {
          target: env.VITE_HOST, // 后端服务器地址
          changeOrigin: true, // 是否改变请求域名
          rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API}`), '')//将原有请求路径中的api替换为''
        }
      }
    },
  }
})
