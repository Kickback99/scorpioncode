// 全部动态导入：markdown-config 被 AppSidebar（首页）静态引用，
// 若在顶层 import 编辑器组件会把编辑器 chunk 拖回首屏，这里全部改为按需加载


export async function createMarkdownPreview(theme = 'github') {
  // 基础预览组件 + 插件（与主题无关）
  const [
    { default: VMdPreview },
    { default: createLineNumbertPlugin },
    { default: createCopyCodePlugin },
    { default: createHighlightLinesPlugin },
  ] = await Promise.all([
    import('@kangc/v-md-editor/lib/preview'),
    import('@kangc/v-md-editor/lib/plugins/line-number/index'),
    import('@kangc/v-md-editor/lib/plugins/copy-code/index'),
    import('@kangc/v-md-editor/lib/plugins/highlight-lines/index'),
  ]);

  await Promise.all([
    import('@kangc/v-md-editor/lib/style/preview.css'),
    import('@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css'),
    import('@kangc/v-md-editor/lib/plugins/highlight-lines/highlight-lines.css'),
  ]);

  const preview = VMdPreview;

  // 按主题懒加载对应的高亮库与样式（github → highlight.js，vuepress → prismjs），避免两者同时打包
  if (theme === 'vuepress') {
    const [{ default: vuepressTheme }, { default: Prism }] = await Promise.all([
      import('@kangc/v-md-editor/lib/theme/vuepress.js'),
      import('prismjs'),
    ]);
    // 补语言组件必须另起一个 await：prism 组件都是裸用全局 Prism 赋值（如 Prism.languages.json = ...），
    // 而 window.Prism 要等 prism-core 执行后才挂上，合并进上面的 Promise.all 会有求值顺序竞态。
    // 只补默认入口没带的（默认已含 markup/css/clike/javascript，即 html/xml/css/js）：
    // xml、html 是 markup 的别名；shell、sh 是 bash 的别名，故都不单列；
    // java 依赖 clike、ts 依赖 javascript，二者默认入口已带，无需前置。
    await Promise.all([
      import('prismjs/components/prism-json'),
      import('prismjs/components/prism-java'),
      import('prismjs/components/prism-bash'),
      import('prismjs/components/prism-typescript'),
      import('prismjs/components/prism-sql'),
      import('prismjs/components/prism-yaml'),
      import('prismjs/components/prism-nginx'),
    ]);
    await Promise.all([
      import('@kangc/v-md-editor/lib/theme/style/vuepress.css'),
      import('prismjs/themes/prism-tomorrow.css'), // Prism主题
    ]);
    // Prism 没有 vue 语言，借道 markup（xml/html 的别名本体），仅能着色 template 段
    preview.use(vuepressTheme, { Prism, codeHighlightExtensionMap: { vue: 'markup' } });
  } else {
    const [{ default: githubTheme }, { default: hljs }, { enhanceHighlightedHtml }] = await Promise.all([
      import('@kangc/v-md-editor/lib/theme/github.js'),
      import('highlight.js'),
      // hljs 高亮结果的补充处理（补 class / 拆 token）单独成文件，并且放在这里
      // 动态加载 —— 只有 github 主题用得上，本文件又被 AppSidebar 静态引用，
      // 静态 import 会把它拖进首屏包
      import('./highlight-enhancer.js'),
    ]);
    await import('@kangc/v-md-editor/lib/theme/style/github.css');
    // 包一层 hljs：只改写 highlight() 的返回值，补上 hljs 自己不发 class 的那些 token。
    // 用 Object.create 而非展开，保证 getLanguage / registerLanguage 等方法照常可用
    const hljsWithVariables = Object.create(hljs);
    hljsWithVariables.highlight = (code, options) => {
      const result = hljs.highlight(code, options);
      return { ...result, value: enhanceHighlightedHtml(result.value, options?.language) };
    };
    // hljs 没有 vue 语言，借道 xml：其语法内置了 script/style 子语言，SFC 三段都能着色
    preview.use(githubTheme, { Hljs: hljsWithVariables, codeHighlightExtensionMap: { vue: 'xml' } });
  }

  return preview
    .use(createLineNumbertPlugin())
    .use(createCopyCodePlugin())
    .use(createHighlightLinesPlugin());
}
