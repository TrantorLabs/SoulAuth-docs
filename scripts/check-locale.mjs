// 语言纯度守卫：扫**构建产物**，不扫源码。
//
// 中文漏进英文页面这件事已经发生过两次，来源都不一样：
//
//   ① 契约的 description 是中文写的，Reference 区改成从契约渲染后原样流了过去；
//   ② 渲染组件里写死了一句中文兜底文案（SchemaBlock 的「对象结构由运行时决定」）。
//
// 两次都在源码检查里隐形，因为问题不在某个文件里，而在**渲染结果**里。
// 所以这条守卫看 dist/：无论字符串来自 markdown、契约还是组件，只要它出现在
// 英文页面的正文里，就会被抓住。
//
// 反向同理：英文页面必须没有 CJK，中文页面必须真的是中文（不能整页还是英文）。

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath，不是 .pathname —— 后者在 Windows 上返回 "/C:/…"，
// join 之后变成 "C:\C:\…"，dist/ 于是「找不到」，而它明明就在那儿。
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'docs/.vitepress/dist')

if (!existsSync(DIST)) {
  console.error('✗ 找不到 dist/ —— 先 `npm run build`')
  process.exit(1)
}

const CJK = /[一-鿿]/g

// 语言切换器用目标语言自己的文字标注，那是正确的。
const ALLOWED = ['简体中文']

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

// 只看正文，且剥掉脚本与标签属性。
function mainText(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)
  let seg = m ? m[1] : html
  seg = seg.replace(/<script[\s\S]*?<\/script>/g, '')
  seg = seg.replace(/<[^>]+>/g, ' ')
  for (const ok of ALLOWED) seg = seg.split(ok).join(' ')
  return seg
}

const errors = []
let en = 0
let zh = 0

for (const file of walk(DIST)) {
  const rel = relative(DIST, file).replace(/\\/g, '/')
  if (rel.includes('/assets/') || rel.startsWith('assets/')) continue
  const text = mainText(readFileSync(file, 'utf8'))
  const cjk = (text.match(CJK) ?? []).length

  if (rel.startsWith('zh/')) {
    zh++
    // 中文页正文几乎不可能一个汉字都没有；真出现了，多半是页面没被翻译。
    const words = text.split(/\s+/).filter((w) => /[a-z]{4,}/i.test(w)).length
    if (cjk < 20 && words > 60) {
      errors.push(`zh/${rel.slice(3)}: 正文只有 ${cjk} 个汉字却有 ${words} 个英文词 —— 这一页可能没翻译`)
    }
  } else {
    en++
    if (cjk > 0) {
      const sample = text.match(/.{0,30}[一-鿿]{2,}.{0,30}/)?.[0]?.trim() ?? ''
      errors.push(
        `${rel}: 英文页正文出现 ${cjk} 个汉字 —— …${sample}…\n` +
          '      来源可能是契约的 description、组件里写死的文案，或 markdown 本身',
      )
    }
  }
}

if (errors.length) {
  console.error('✗ 语言纯度检查未通过：\n')
  for (const e of errors) console.error('  • ' + e)
  process.exit(1)
}
console.log(`✓ 语言纯度：${en} 个英文页无 CJK，${zh} 个中文页均已翻译`)
