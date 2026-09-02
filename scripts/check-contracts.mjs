// 契约快照守卫。
//
// `docs/.vitepress/data/contracts/*.json` 是 SoulAuth 仓库 `contracts/*.yaml`
// 的派生快照。派生数据的风险很具体：**它看起来和准确数据一模一样。**
// 一份三个月前的端点表不会显得可疑，读者会照着它调。
//
// 这个脚本不能判断快照是不是最新的（源仓库不在这里），它守的是另外三件事：
//
//   ① 四份注册表齐全、是合法 JSON、且不是空壳；
//   ② SOURCE.json 记录了来源 commit，且不是从有未提交改动的工作区取的
//      —— 那种快照对应的东西在 git 历史里根本找不到。
//
// 曾经还有两条，都随各自的守卫对象一起删掉了，**失去的保护记在这里**：
//
//   · 每个渲染契约数据的页面必须放 <ContractNote> 写出来源 commit。组件已按要求
//     从全站移除 —— 站上现在可以渲染一份过期的快照，页面上没有任何东西说它取自
//     哪次提交。②仍拦住「取自有未提交改动的工作区」，拦不住「快照本身很旧」。
//   · 一致性读数（conformance-data.ts）与契约快照的 commit 是否一致。项目状态页
//     已删，读数文件随之删除 —— 站上不再有测试数字，也就不再有「数字与契约来自
//     不同 commit」这件事可查。

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath，不是 .pathname —— 后者在 Windows 上返回 "/C:/…"，
// join 之后变成 "C:\C:\…"，脚本直接 ENOENT 崩掉。
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DATA = join(ROOT, 'docs/.vitepress/data/contracts')
const DOCS = join(ROOT, 'docs')

const REGISTRIES = {
  'openapi.json': (d) => Object.keys(d.paths ?? {}).length,
  'permissions.json': (d) => (d.permissions ?? []).length,
  'configuration.json': (d) => (d.groups ?? []).reduce((n, g) => n + (g.keys?.length ?? 0), 0),
  'standards.json': (d) => (d.specifications ?? []).length,
}

const errors = []
const warnings = []


// ① 注册表
const sizes = {}
for (const [file, count] of Object.entries(REGISTRIES)) {
  const p = join(DATA, file)
  if (!existsSync(p)) {
    errors.push(`缺少 ${file} —— 跑 \`python3 scripts/sync-contracts.py\``)
    continue
  }
  let data
  try {
    data = JSON.parse(readFileSync(p, 'utf8'))
  } catch (e) {
    errors.push(`${file} 不是合法 JSON：${e.message}`)
    continue
  }
  const n = count(data)
  sizes[file] = n
  if (n === 0) errors.push(`${file} 解析出 0 条 —— 结构变了，渲染组件会静默出一张空表`)
}

// ② 来源
const srcPath = join(DATA, 'SOURCE.json')
if (!existsSync(srcPath)) {
  errors.push('缺少 SOURCE.json —— 没有来源 commit，读者无从判断这份数据有多新')
} else {
  const src = JSON.parse(readFileSync(srcPath, 'utf8'))
  if (!src.commit || src.commit.length < 40) errors.push('SOURCE.json 里没有完整 commit')
  if (src.dirty) {
    errors.push(
      'SOURCE.json 标记 dirty —— 快照取自有未提交改动的工作区，' +
        '它对应的契约在 git 历史里找不到。提交 SoulAuth 那边的改动后重新同步。',
    )
  }
}

// ③ 英文可渲染字段里不得出现 CJK
//
// 契约是本仓库的产物，描述天然是中文写的。Reference 区改成从契约渲染之后，
// 那些中文会**原样流到英文页面上** —— 而这在 HTML 层面的检查里完全看不出来：
// 元素数量对、来源标记对，只有真的看一眼才会发现整页是中文。
//
// 约定：`description` / `note` / `scope` 等主字段是英文，中文放同名 `*_zh`。
const CJK = /[\u4e00-\u9fff]/
const LOCALISED = new Set(['description', 'note', 'scope', 'summary', 'detail', 'title'])
function scan(node, path, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => scan(v, `${path}[${i}]`, out))
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k.endsWith('_zh')) continue
      scan(v, `${path}.${k}`, out)
    }
  } else if (typeof node === 'string' && CJK.test(node)) {
    out.push(path)
  }
}
for (const file of Object.keys(REGISTRIES)) {
  const p = join(DATA, file)
  if (!existsSync(p)) continue
  const found = []
  scan(JSON.parse(readFileSync(p, 'utf8')), file, found)
  for (const where of found.slice(0, 5)) {
    errors.push(
      `${where} 是中文 —— 主字段必须是英文，中文放同名 \`_zh\` 字段。` +
        '否则它会原样渲染到英文页面上。',
    )
  }
  if (found.length > 5) errors.push(`${file} 另有 ${found.length - 5} 处同类问题`)
}


console.log(
  `✓ 契约快照：${sizes['openapi.json']} 路径 / ${sizes['permissions.json']} 权限 / ` +
    `${sizes['configuration.json']} 配置项 / ${sizes['standards.json']} 规范，` +
    `四份注册表齐全`,
)
// 警告在成功行之后打印，这样它不会被误读成失败，也不会被滚屏吞掉。
for (const w of warnings) console.warn('\n⚠ ' + w)
