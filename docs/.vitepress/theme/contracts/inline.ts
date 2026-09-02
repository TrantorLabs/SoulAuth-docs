// 契约文本里的极简行内 markdown。
//
// 注册表的描述里带 `**强调**` 与 `` `code` ``，用纯文本插值渲染会把星号和反引号
// 原样显示出来 —— 那些标记不是装饰，它们标的正是每条描述里最要紧的那个词
// （「**不是**监听地址」「**Mandatory** once…」）。
//
// 只支持这两种，而且**先转义再替换**。内容来自本仓库的契约而不是用户输入，
// 但一个会把任意字符串塞进 v-html 的函数迟早会被喂进别的东西。

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function inlineMarkdown(src: string | undefined): string {
  if (!src) return ''
  return src
    .replace(/[&<>"']/g, (c) => ESCAPE[c])
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
