// 守住「文档不复述机器契约里的确切事实」这条纪律。
//
// 这个脚本最早的职责是：比对文档里写死的端点数与源码路由表。审查期间这个
// 项目的端点总数先后被说成 66 / 68 / 70，没有一个对，所以让 CI 去数。
//
// 现在职责反过来了。按 V3 语料 23 §2「Contract Ownership」，SoulAuth-owned
// 的 Exact Wire 归 Published Machine-readable Contract 所有；文档负责准确
// 解释这些 Contract，不做第二个 Wire Source of Truth。端点总数正是这样一个
// Exact Wire 事实——它的守卫已经搬到 SoulAuth 仓库的
// `tests/conformance.rs::j4`（openapi.yaml ↔ 路由表双向断言）。
//
// 于是文档这边要守的不再是「数字对不对」，而是「有没有人又把数字抄回来」。
// 一个抄回来的数字即使今天是对的，也重新制造了会漂移的第二处真相。
//
// 用法：SOULAUTH_SRC=../SoulAuth node scripts/check-endpoints.mjs
// 源码不可达时仍然会跑——本检查不需要源码。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : []
  })
}

// 「N 个端点 / N endpoints / N 条路径」这类断言。
//
// 只匹配数字紧邻端点名词的写法。像「64 paths / 75 operations」这种出现在
// contracts/openapi.yaml 头注释里的描述不在文档仓库中，不会被扫到。
const CLAIM_PATTERNS = [
  { re: /\b(\d+)\s+endpoints?\b/gi, what: 'endpoint count' },
  { re: /\b(\d+)\s*个端点/g, what: '端点数' },
  { re: /\b(\d+)\s+routes?\b/gi, what: 'route count' },
  { re: /\b(\d+)\s*条路由/g, what: '路由数' },
  { re: /\b(\d+)\s+paths?\s*\/\s*(\d+)\s+operations?\b/gi, what: 'path/operation count' },
]

const failures = []

for (const file of walk('docs')) {
  // VitePress 内部目录不算文档正文。
  if (file.includes('.vitepress')) continue
  const text = readFileSync(file, 'utf8')
  for (const { re, what } of CLAIM_PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      failures.push(`${file}: 出现 ${what} 断言 「${m[0].trim()}」`)
    }
  }
}

if (failures.length) {
  for (const f of failures) console.error(`✖ ${f}`)
  console.error(
    `\n${failures.length} 处把 Exact Wire 事实抄进了文档。\n` +
      '端点/路由计数归 contracts/openapi.yaml，由 SoulAuth 仓库的\n' +
      'tests/conformance.rs::j4 守卫。文档应链接到 Machine Contract，\n' +
      '而不是复述一个会各自漂移的数字。'
  )
  process.exit(1)
}

console.log('✓ 文档没有复述端点/路由计数这类 Exact Wire 事实')
