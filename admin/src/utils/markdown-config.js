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

// 只取 core：全量入口会把 191 种语言一起打进 chunk（实测 842KB → 58KB）；语言表与 front/client 对齐，
// xml/javascript/css 是硬依赖 —— vue 借道 xml 高亮，而 xml 的 script/style 段由 subLanguage 引用 javascript/css
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';
import nginx from 'highlight.js/lib/languages/nginx';
import python from 'highlight.js/lib/languages/python';
import diff from 'highlight.js/lib/languages/diff';
import Prism from 'prismjs';

// 以后用到新语言在这里加一行即可（与 front/client 的 hljs 语言表同集）
const hljsLanguages = {
  xml, javascript, css, typescript, scss, json, yaml, markdown, bash,
  java, sql, nginx, python, diff,
};
Object.entries(hljsLanguages).forEach(([name, language]) => hljs.registerLanguage(name, language));

/**
 * 创建 Markdown 编辑器/预览器组件
 * @param {string} theme - 主题 'github' | 'vuepress'
 * @param {boolean} isPreview - true=仅预览模式（VMdPreview） / false=编辑模式（VMdEditor）
 * @returns {object} Vue 组件
 */
export function createMarkdownPreview(theme = 'github', isPreview = false) {
  const base = isPreview ? VMdPreview : VMdEditor;

  if (theme === 'github') {
    // hljs 没有 vue 语言，借道 xml：其语法内置了 script/style 子语言，SFC 三段都能着色
    base.use(githubTheme, { Hljs: hljs, codeHighlightExtensionMap: { vue: 'xml' } });
  } else if (theme === 'vuepress') {
    // Prism 没有 vue 语言，借道 markup（xml/html 的别名本体），仅能着色 template 段
    base.use(vuepressTheme, { Prism, codeHighlightExtensionMap: { vue: 'markup' } });
  }

  return base
    .use(createLineNumbertPlugin())
    .use(createCopyCodePlugin());
}

// 默认导出 github 主题的预览器
export default createMarkdownPreview('github');