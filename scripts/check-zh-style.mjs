// 中文文档写作约定的机器可检查部分。见 STYLE.zh.md。
//
// 中文站曾经是英文站的**逐句译文**，结果是英文的信息结构被原样保留，读起来像机翻。
// 最刺眼的三个信号可以量化，也就守在这里：
//
//   ① 破折号 `——`：英文 em-dash 的直译。一页三次以上通常说明句子该拆了。
//   ② 引号混用：「」与 "" 两套并存。
//   ③ 术语不统一：同一个概念四个名字（AI Agent / Agent / AI 主体 / 非人主体）。
//
// 句式层面的毛病（「它」开头、长定语、英式语序）机器判不准，误报比漏报更伤 ——
// 一条老是误报的规则会被人学会无视。那部分靠 STYLE.zh.md 和人来把。

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath，不是 .pathname —— 后者在 Windows 上返回 "/C:/…"，
// join 之后变成 "C:\C:\…"，脚本直接 ENOENT 崩掉。
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ZH = join(ROOT, 'docs/zh')

// 一页允许的破折号上限。不是零：中文破折号有它正当的用法，
// 只是不该承担英文 em-dash 那么大的工作量。
const DASH_BUDGET = 3

const BANNED_TERMS = [
  ['AI Agent', 'AI 主体'],
  ['智能体', 'AI 主体'],
  ['代理商', 'AI 主体'],
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

// 只看正文：代码块、行内代码、HTML/Vue 标签里的引号与破折号不算。
function prose(src) {
  return src
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*\|.*\|\s*$/gm, (row) => row) // 表格保留，正文的一部分
}

const errors = []
const warnings = []
let dashTotal = 0

for (const file of walk(ZH)) {
  const rel = relative(ZH, file)
  const body = prose(readFileSync(file, 'utf8'))

  const dashes = (body.match(/——/g) ?? []).length
  dashTotal += dashes
  if (dashes > DASH_BUDGET) {
    errors.push(
      `zh/${rel}: 破折号 ${dashes} 处，超出 ${DASH_BUDGET} —— ` +
        '多数应改成冒号、分号，或直接断句',
    )
  }

  // 中文正文里的成对英文引号
  const straight = body.match(/"[^"\n]{2,60}"/g) ?? []
  const inProse = straight.filter((s) => /[一-鿿]/.test(s))
  if (inProse.length) {
    errors.push(`zh/${rel}: ${inProse.length} 处英文引号，统一用「」：${inProse[0]}`)
  }

  for (const [bad, good] of BANNED_TERMS) {
    if (body.includes(bad)) errors.push(`zh/${rel}: 用了「${bad}」，统一写「${good}」`)
  }

  // 中英之间缺空格。只报中文紧贴大写标识符这种明显的，避免误报。
  const noSpace = body.match(/[一-鿿][A-Z][A-Za-z_]{3,}/g) ?? []
  if (noSpace.length) warnings.push(`zh/${rel}: 中英间缺空格 ${noSpace.length} 处，如 ${noSpace[0]}`)
}

for (const w of warnings) console.warn('  ! ' + w)
if (errors.length) {
  console.error('✗ 中文写作约定检查未通过：\n')
  for (const e of errors) console.error('  • ' + e)
  console.error('\n  约定见 STYLE.zh.md')
  process.exit(1)
}
console.log(`✓ 中文页写作约定：破折号共 ${dashTotal} 处，引号与术语统一`)
