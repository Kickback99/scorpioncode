import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// 主题配置（单一数据源：从 theme-config.js 提取背景色注入 index.html，改主题颜色自动同步）
import { themeConfig } from './src/plugins/theme-config.js'

// 各主题名 → 背景色映射（来自 theme-config.js，改主题颜色此处自动更新）
const themeBgMap = Object.fromEntries(
  Object.entries(themeConfig.themes).map(([name, theme]) => [name, theme.colors.background])
)

// 注入 index.html 的内联脚本：JS 加载前按持久化主题给 <html> 上背景色，消除深色模式刷新闪白
const themeBgScript = `;(function () {
  try {
    var t = JSON.parse(localStorage.getItem('theme') || '{}')
    var name = t.currentTheme || '${themeConfig.defaultTheme}'
    var bgMap = ${JSON.stringify(themeBgMap)}
    var bg = bgMap[name] || bgMap['${themeConfig.defaultTheme}']
    document.documentElement.style.backgroundColor = bg
    document.documentElement.style.colorScheme = name.slice(-5) === '-dark' ? 'dark' : 'normal'
  } catch (e) {}
})()`

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
            // marked 是首页摘要提取（useExtractText）的依赖，若并入 editor 会把编辑器 chunk 拖回首屏
            editor: ['@kangc/v-md-editor', 'prismjs', 'markdown-it', 'highlight.js'],
            utils: ['axios', 'mitt'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: [
        'markdown-it-toc-done-right', // 明确排除这个包
        // 排除 vuetify 预构建：避免 optimizeDeps(esbuild) 预构建与 vite-plugin-vuetify 的
        // virtual sass 模块(resolveId 异步写入 / load 同步读取 tempFiles)在冷启动时竞态，导致 404
        'vuetify',
      ]
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
      // 深色模式防刷新闪白：把主题背景色内联脚本注入 <head>（颜色来自 theme-config.js）
      {
        name: 'inject-theme-bg',
        transformIndexHtml() {
          return {
            tags: [
              { tag: 'script', children: themeBgScript, injectTo: 'head' },
            ],
          }
        },
      },
      vue(),
      vuetify({
        autoImport: true,  // 必须启用自动导入
        styles: { configFile: 'src/assets/styles/variables.scss' },// 可选，用于自定义变量
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
