// 状态徽章守卫。
//
// 徽章存在的意义是让「已支持」这类话可核查。可核查有两个前提，这个脚本守住它们：
//
//   ① 声称到了 `tested` / `conformant` 就必须写出守卫名 —— 否则徽章只是换了
//      个好看写法的形容词，比不加更糟：它看起来像有证据。
//   ② 词汇表演示必须显式标 `glossary` —— 不标的话它会触发 ① 的警告，
//      而页面上出现假警告，读者很快学会无视警告，真的那个也一起被无视。
//
// 还顺带守住中英两侧的徽章用法一致：一边标了 supported、另一边标了 planned，
// 是双语文档最容易出、也最难靠肉眼发现的那类偏差。

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath，不是 .pathname —— 后者在 Windows 上返回 "/C:/…"，
// join 之后变成 "C:\C:\…"，脚本直接 ENOENT 崩掉。
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DOCS = join(ROOT, 'docs')

const NEEDS_GUARD = new Set(['tested', 'conformant'])
const KNOWN = new Set([
  'implemented', 'supported', 'tested',
  'conformant', 'certified', 'deprecated', 'planned',
])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.vitepress' || name === 'dist') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

const TAG = /<Status\s+([^>]*?)\/>/g
function attrs(raw) {
  const kind = raw.match(/kind="([^"]*)"/)?.[1]
  const guard = raw.match(/guard="([^"]*)"/)?.[1]
  return { kind, guard, glossary: /\bglossary\b/.test(raw) }
}

const errors = []
/** @type {Map<string, string[]>} 相对路径（去 zh 前缀） → kind 序列 */
const perPage = new Map()

for (const file of walk(DOCS)) {
  const rel = relative(DOCS, file)
  const body = readFileSync(file, 'utf8')
  const kinds = []

  for (const m of body.matchAll(TAG)) {
    const { kind, guard, glossary } = attrs(m[1])
    const at = `${rel}: <Status kind="${kind ?? '?'}">`

    if (!kind || !KNOWN.has(kind)) {
      errors.push(`${at} 不是七个状态词之一（五级阶梯 + planned / deprecated）`)
      continue
    }
    if (!glossary && NEEDS_GUARD.has(kind) && !guard) {
      errors.push(
        `${at} 声称到了 \`${kind}\` 却没有 guard —— ` +
        `要么写出守住它的断言，要么标 glossary 表示这里只是在解释词义`,
      )
    }
    if (glossary && guard) {
      errors.push(`${at} 同时标了 glossary 与 guard —— 它到底是在解释词义还是在声称？`)
    }
    kinds.push(glossary ? `${kind}*` : kind)
  }

  const key = rel.startsWith('zh/') ? rel.slice(3) : rel
  const bucket = perPage.get(key) ?? []
  bucket.push(kinds.join(','))
  perPage.set(key, bucket)
}

// 中英对等
for (const [page, variants] of perPage) {
  if (variants.length === 2 && variants[0] !== variants[1]) {
    errors.push(
      `${page} 中英徽章不一致：\n      en: [${variants[0]}]\n      zh: [${variants[1]}]`,
    )
  }
}

const total = [...perPage.values()].flat().join(',').split(',').filter(Boolean).length
if (errors.length) {
  console.error('✗ 状态徽章检查未通过：\n')
  for (const e of errors) console.error('  • ' + e)
  process.exit(1)
}
console.log(`✓ ${total} 处状态徽章：声称都指得出守卫，词义演示都已标注，中英一致`)
