// 契约里的每条路径，要么在散文里讲过，要么显式登记为「表格足够」。
//
// 现有守卫都只查一个方向：check:citations 查「散文里提到的端点是否真的存在」，
// check:endpoints 禁止把端点计数抄进散文。**没有人查反方向** —— 一条端点可以
// 完全不出现在任何一句话里，而站点照样全绿。
//
// 这一条曾经漏掉了什么：71 条路径有 48 条从没在散文里出现过，其中包括邮箱验证、
// 密码重置、MFA、社交登录四条**多步流程**。它们在自动渲染的参考表里都有一行，
// 但表格表达不了调用顺序、中间状态和失败长什么样。要接社交登录的人打开文档站，
// 找不到任何一页告诉他先调哪个。
//
// # 「表格足够」不是漏洞，是一种判断
//
// 大量端点确实只需要表格：RBAC 的增删改查、用户列表、审计看板 —— 它们之间没有
// 顺序，参数在表里写着，读者看一眼就会用。所以这条守卫不要求每条路径都写散文，
// 它要求的是**这个判断被明确做出并写下理由**。
//
// 登记写在拥有那批端点的参考页上，与被登记的表格放在一起：
//
//     <!-- table-only: /api/rbac/** — 角色与权限的增删改查，调用之间没有顺序 -->
//
// 必须带理由。空登记等于一张没人敢删的名单，那正是把判断藏起来的做法。
//
// # 中英分开查
//
// 一条流程只在英文页讲过，对中文读者而言就是没讲过。所以两个语种各查一遍。

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONTRACT = join(ROOT, 'docs/.vitepress/data/contracts/openapi.json')

function mdFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === '.vitepress' || name === 'dist' || name === 'node_modules') continue
    if (statSync(p).isDirectory()) out.push(...mdFiles(p))
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

// <!-- table-only: <路径或前缀+**> — <理由> -->
const DECL = /<!--\s*table-only:\s*(\S+)\s*[—-]+\s*(\S[^>]*?)-->/g

// 带参路径按模板匹配，不按字面。
//
// 契约里写的是 `/api/auth/verify-email/:token`，而散文里正当地写成
// `/api/auth/verify-email/$TOKEN`。字面比对会把「已经讲过一整页」判成没讲过。
// 反过来也要防住：`:user_id` 必须真的对上一个路径段，否则 `/api/users/` 这样
// 光秃秃的前缀会把 6 条子路径全算成已覆盖。
const mentions = (prose, p) => {
  if (!p.includes(':')) return prose.includes(p)
  const rx = new RegExp(
    p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-z_]+/g, '[^\\s/)"\'`]+'),
  )
  return rx.test(prose)
}

const paths = Object.keys(JSON.parse(readFileSync(CONTRACT, 'utf8')).paths)
const files = mdFiles(join(ROOT, 'docs'))

const errors = []
const stats = []

for (const [label, pick] of [
  ['英文', (rel) => !rel.startsWith('zh/')],
  ['中文', (rel) => rel.startsWith('zh/')],
]) {
  let prose = ''
  const declared = []
  for (const f of files) {
    const rel = relative(join(ROOT, 'docs'), f).split('\\').join('/')
    if (!pick(rel)) continue
    const body = readFileSync(f, 'utf8')
    prose += body
    for (const m of body.matchAll(DECL)) declared.push({ pat: m[1], why: m[2].trim(), rel })
  }

  const covers = (p) =>
    declared.some((d) =>
      d.pat.endsWith('**') ? p.startsWith(d.pat.slice(0, -2)) : d.pat === p,
    )

  const missing = paths.filter((p) => !mentions(prose, p) && !covers(p))
  stats.push(`${label}：${paths.length} 条路径，散文覆盖 ${paths.filter((p) => mentions(prose, p)).length}，登记为表格足够 ${paths.length - paths.filter((p) => mentions(prose, p)).length - missing.length}`)

  for (const p of missing) {
    errors.push(
      `${label}侧 \`${p}\` 既没有在任何一句话里出现，也没有被登记为「表格足够」。\n` +
        `      要么写一段说明它，要么在拥有它的参考页上登记并写明理由：\n` +
        `        <!-- table-only: ${p} — 为什么表格就够了 -->`,
    )
  }

  for (const d of declared) {
    if (d.why.length < 6) {
      errors.push(`${d.rel} 的 table-only 登记没有像样的理由：\`${d.pat}\` —— 空登记等于把判断藏起来`)
    }
  }
}

// 下界：读不到路径就说明取值坏了，而不是「全都覆盖到了」。
if (paths.length === 0) {
  errors.push('契约快照里一条路径都没读到 —— 这条守卫什么都没查')
}

if (errors.length) {
  console.error('✖ 端点覆盖检查未通过：\n')
  for (const e of errors) console.error('  • ' + e)
  console.error('\n  见 scripts/check-coverage.mjs 开头的说明')
  process.exit(1)
}

console.log('✓ 端点覆盖：' + stats.join(' · '))
