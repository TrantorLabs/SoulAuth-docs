// 守住三张 Canonical Figure 的三件事。
//
// 图从位图改成组件以后，会悄悄坏掉的东西变了。以前担心的是「文件丢了」，
// 现在担心的是这三类 —— 全都不会让构建变红：
//
//   1. 语言串了：中文页写成 <Figure2 locale="en" />，页面正常渲染，只是
//      读者看到的是英文图。
//   2. 两个 locale 的内容不对等：这正是位图版 Figure 1 出过的问题 ——
//      英文版有三条底部注释，中文版一条都没有。TypeScript 能保证键一致，
//      保证不了数组长度一致（notes 三条 vs 两条它不会报错）。
//   3. 冒出第四张核心图：语料《Final Refinement Constitution》§18 把公共
//      核心图锁死为 WHERE / WHO / HOW 三张。
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// 直接 import `.ts`：需要 Node ≥ 22.18（原生类型剥离，无需 flag）。
// package.json 的 engines 与 CI 的 setup-node 都钉在这个版本上 ——
// 这条依赖曾在 CI（node 20）上静默失败，连带整个站点停止部署。
import { fig1, fig2, fig3 } from '../docs/.vitepress/theme/figures/strings.ts'

const failures = []

// ── 1 & 3：用法与语言 ────────────────────────────────────────────────
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []
  })
}

const seen = new Set()
let uses = 0

for (const file of walk('docs')) {
  if (file.includes('.vitepress')) continue
  // join 在 Windows 上给的是反斜杠，直接 startsWith('docs/zh/') 永远为 false ——
  // 那样每个中文页都会被当成英文页来查 locale，这道检查在 Windows 上静默失效。
  const rel = file.replace(/\\/g, '/')
  const isZh = rel.startsWith('docs/zh/')
  const want = isZh ? 'zh' : 'en'
  const text = readFileSync(file, 'utf8')

  for (const m of text.matchAll(/<Figure(\d+)\s+locale="(en|zh)"\s*\/>/g)) {
    uses++
    const [, num, locale] = m
    if (!['1', '2', '3'].includes(num)) {
      failures.push(`${file}: Figure${num} —— 公共核心图只有三张`)
    }
    if (locale !== want) {
      failures.push(`${file}: <Figure${num} locale="${locale}"> 应为 "${want}"`)
    }
    seen.add(`${num}.${locale}`)
  }

  // 漏写 locale 会让组件拿 undefined 取字符串，整张图空掉
  for (const m of text.matchAll(/<Figure(\d+)(?![\s\S]{0,40}locale=)/g)) {
    failures.push(`${file}: <Figure${m[1]}> 没有 locale prop`)
  }
}

for (const n of ['1', '2', '3']) {
  for (const l of ['en', 'zh']) {
    if (!seen.has(`${n}.${l}`)) failures.push(`Figure${n} 的 ${l} 版没有任何页面使用`)
  }
}

// ── 1b：六个图片文件都必须在 ────────────────────────────────────────
//
// 图从组件版换回位图之后，`<Figure2 locale="zh" />` 拿不到文件时渲染出来是一个
// 碎图标 —— 页面正常、构建全绿、只有读者看到坏图。这一条把它变成 CI 能发现的。
const FILES = {
  1: 'figure-1-soulseed-agi-infrastructure',
  2: 'figure-2-actor-centred-identity-model',
  3: 'figure-3-soulauth-architecture',
}
for (const [n, base] of Object.entries(FILES)) {
  for (const l of ['en', 'zh']) {
    const p = join(ROOT, 'docs/public/figures', `${base}.${l}.png`)
    if (!existsSync(p)) failures.push(`Figure${n} 的 ${l} 版位图缺失：docs/public/figures/${base}.${l}.png`)
  }
}

// ── 2：两个 locale 的标题与图注必须结构对等 ─────────────────────────
//
// 图本身改回位图之后，这一条守的**只剩标题与图注**（它们仍从 strings.ts 取）。
// 图内文案的中英对等不再由结构保证 —— 那是位图版本身的代价，见
// `figures/CHANGES.md`。这里不假装还守着它。
function shape(v, path, out) {
  if (Array.isArray(v)) {
    out.push(`${path}[]=${v.length}`)
    v.forEach((x, i) => shape(x, `${path}[${i}]`, out))
  } else if (v && typeof v === 'object') {
    for (const k of Object.keys(v).sort()) shape(v[k], `${path}.${k}`, out)
  } else {
    // 只记「有没有值」，不记值本身 —— 文案本来就该不同
    out.push(`${path}=${v === undefined || v === '' ? 'empty' : 'set'}`)
  }
  return out
}

for (const [name, fig] of [['fig1', fig1], ['fig2', fig2], ['fig3', fig3]]) {
  const en = shape(fig.en, name, [])
  const zh = shape(fig.zh, name, [])
  const onlyEn = en.filter((x) => !zh.includes(x))
  const onlyZh = zh.filter((x) => !en.includes(x))
  for (const x of onlyEn) failures.push(`${name}: 仅 en 有 ${x}`)
  for (const x of onlyZh) failures.push(`${name}: 仅 zh 有 ${x}`)
}

if (failures.length) {
  for (const f of failures) console.error(`✖ ${f}`)
  process.exit(1)
}
console.log(`✓ 三张 Canonical Figure：${uses} 处引用语言均正确，中英结构完全对等`)
