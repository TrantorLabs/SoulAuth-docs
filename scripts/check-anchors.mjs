// 校验站内链接的 #锚点 是否真的存在。
//
// VitePress 的 ignoreDeadLinks 只查页面存在与否，**不查锚点**。
// 中文标题生成的 id 会做转写（逗号被换成 `-`、空格变 `-`），
// 手写锚点极易差一个字符，而症状只是「点了没反应」—— 不会有任何构建报错。
//
// # base 前缀必须先剥掉
//
// 构建产物里的 href 带着部署 base：`/SoulAuth-docs/reference/api-conventions#errors`，
// 而这里的 id 表是按 dist 内的相对路径建的：`/reference/api-conventions`。
// 不剥前缀，每一次查表都落空，然后走「页面不存在，交给 VitePress」那条 continue ——
// 于是这个脚本一条都不检查，还打印「全部对上」。
//
// 这**发生过**：CI 用 `DOCS_BASE=/<repo>/` 构建，所以线上那份配置里这道检查
// 一直是空转的绿灯。下面 `checked === 0` 那条断言就是为它加的 —— base 怎么变都好，
// 一条都没查到本身就该是错误，而不是成功。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = 'docs/.vitepress/dist'

// 与 docs/.vitepress/config.mts 的 base 保持一致。
const BASE = (process.env.DOCS_BASE ?? '/SoulAuth-docs/').replace(/\/+$/, '')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.html')) out.push(p)
  }
  return out
}

const pages = walk(DIST)
// 每个页面提供的 id 集合
const ids = new Map()
for (const p of pages) {
  const html = readFileSync(p, 'utf8')
  ids.set(
    '/' + relative(DIST, p).replace(/\\/g, '/').replace(/\.html$/, ''),
    new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  )
}

let bad = 0
let checked = 0
for (const p of pages) {
  const from = '/' + relative(DIST, p).replace(/\\/g, '/').replace(/\.html$/, '')
  const html = readFileSync(p, 'utf8')
  for (const m of html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
    let [, path, anchor] = m
    path = decodeURIComponent(path)
    if (BASE && path.startsWith(BASE + '/')) path = path.slice(BASE.length)
    path = path.replace(/\/$/, '') || '/index'
    anchor = decodeURIComponent(anchor)
    const target = ids.get(path) ?? ids.get(path + '/index')
    if (!target) continue // 页面存在与否交给 VitePress 的死链检查
    checked++
    if (!target.has(anchor)) {
      console.error(`✖ ${from}  →  ${path}#${anchor}`)
      bad++
    }
  }
}

if (bad) {
  console.error(`\n${bad} 个锚点指向不存在的位置`)
  process.exit(1)
}
// 一条都没查到 = 这个脚本没在工作（多半是 base 没剥对），不是「全都对」。
if (checked === 0) {
  console.error(
    '✗ 一个站内锚点都没检查到 —— 说明 href 的 base 前缀没被剥掉，或者 dist 是空的。\n' +
      `  当前 DOCS_BASE=${process.env.DOCS_BASE ?? '(未设置，用默认值)'}，` +
      `剥离前缀 "${BASE}"。\n` +
      '  这是空转的绿灯，比失败更糟。',
  )
  process.exit(1)
}
console.log(`✓ ${checked} 个站内锚点全部对得上`)
