import { marked } from 'marked';

/* export const mdToPlainText = (mdStr) =>{

  if(!mdStr){
    return
  }
    // 先转换为HTML
  const html = marked.parse(mdStr);
  // 再从HTML提取文本
  return html.replace(/<[^>]*>?/gm, '');
} */


export const mdToPlainText = (mdStr) => {
  // t_question：空值处理
  if (!mdStr) return ''; // 处理null/undefined
  
  try {
    const html = marked.parse(mdStr);
    // return html.replace(/<[^>]*>?/gm, '').substring(0, 150); // 限制长度
    return html.replace(/<[^>]*>?/gm, '')
  } catch (e) {
    console.error('Markdown解析失败:', e);
    return mdStr.substring(0, 150); // 降级方案
  }
}