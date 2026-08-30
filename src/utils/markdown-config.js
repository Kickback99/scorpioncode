// src/utils/markdown-config.js
import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';
import VMdEditor from '@kangc/v-md-editor';
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/base-editor.css';

// 主题配置
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';

import hljs from 'highlight.js';
import Prism from 'prismjs';

/**
 * 创建 Markdown 编辑器/预览器组件
 * @param {string} theme - 主题 'github' | 'vuepress'
 * @param {boolean} isPreview - true=仅预览模式(VMdPreview) / false=编辑模式(VMdEditor)
 * @returns {object} Vue 组件
 */
export function createMarkdownPreview(theme = 'github', isPreview = false) {
  const base = isPreview ? VMdPreview : VMdEditor;

  if (theme === 'github') {
    base.use(githubTheme, { Hljs: hljs });
  } else if (theme === 'vuepress') {
    base.use(vuepressTheme, { Prism });
  }

  return base
    .use(createLineNumbertPlugin())
    .use(createCopyCodePlugin());
}

// 默认导出 github 主题的预览器
export default createMarkdownPreview('github');