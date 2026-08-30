import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import 'prismjs/themes/prism-tomorrow.css'; // Prism主题

import hljs from 'highlight.js';
import Prism from 'prismjs';

// 代码行号
import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';

// 复制代码块
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';

// 高亮代码行
import createHighlightLinesPlugin from '@kangc/v-md-editor/lib/plugins/highlight-lines/index';
import '@kangc/v-md-editor/lib/plugins/highlight-lines/highlight-lines.css';

// 创建不同主题的预览器
export function createMarkdownPreview(theme = 'github') {
  const preview = VMdPreview;
  
  if (theme === 'github') {
    preview.use(githubTheme, { Hljs: hljs });
  } else if (theme === 'vuepress') {
    preview.use(vuepressTheme, { Prism });
  }
  
  return preview
    .use(createLineNumbertPlugin())
    .use(createCopyCodePlugin())
    .use(createHighlightLinesPlugin());
}


// 默认导出 github 主题的预览器
export default createMarkdownPreview('github');