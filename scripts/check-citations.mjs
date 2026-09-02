// 引用守卫：散文里提到的端点、配置项、权限名必须真实存在。
//
// Reference 区是从契约渲染的，那部分不会漂。会漂的是**散文** —— 每一页里
// 随手写的 `/api/rbac/check/permission/:name`、`MAX_ATTEMPTS`、
// `soulauth:actors.admin`。它们看起来一模一样，只有照着做的人才会发现不对。
//
// 这类错误的成本很不对称：读者不会怀疑文档，只会怀疑自己。
//
// 实测抓到过两处：路径参数名写成 `:name`（契约里是 `:permission_name`），
// 以及配置项被简写成 `MAX_ATTEMPTS`（全名 `LOCKOUT_MAX_ATTEMPTS`，
// 按简写去配置参考里搜是搜不到的）。

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath，不是 .pathname —— 后者在 Windows 上返回 "/C:/…"，
// join 之后变成 "C:\C:\…"，脚本直接 ENOENT 崩掉。
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DOCS = join(ROOT, 'docs')
const DATA = join(ROOT, 'docs/.vitepress/data/contracts')

const openapi = JSON.parse(readFileSync(join(DATA, 'openapi.json'), 'utf8'))
const config = JSON.parse(readFileSync(join(DATA, 'configuration.json'), 'utf8'))
const perms = JSON.parse(readFileSync(join(DATA, 'permissions.json'), 'utf8'))

const realPaths = Object.keys(openapi.paths ?? {})
const realKeys = new Set((config.groups ?? []).flatMap((g) => (g.keys ?? []).map((k) => k.name)))
const realPerms = new Set((perms.permissions ?? []).map((p) => p.name))

// 一条引用命中，当它等于某条真实路径，或只在参数名上不同。
const pathMatchers = realPaths.map(
  (p) => new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:\w+/g, ':[a-z_]+') + '$'),
)
// 前缀式引用（「`/api/me` 下的一切」）不是端点引用，不参与校验。
//
// `/api/auth/callback` 在这里的理由与其它几条一样：契约里没有这个端点，只有
// `/api/auth/callback/google` 与 `/api/auth/callback/github`。它是
// `OAUTH_REDIRECT_URL` 的值，SoulAuth 会把 provider 名字接在后面。
const prefixes = new Set(['/api', '/api/me', '/api/oidc', '/api/rbac', '/api/users', '/api/auth', '/api/auth/callback', '/api/actors', '/api/audit', '/api/security', '/api/ops', '/api/bootstrap'])

// 大写下划线串里，shell 变量与外部工具的环境变量不归这条守卫管。
const NOT_OURS = /^(CARGO|RUST|DOCS|GITHUB|LD|NODE|NPM|HOME|PATH)_/
const SHELL_VARS = new Set([
  'ACCESS_TOKEN', 'ADMIN_TOKEN', 'REFRESH_TOKEN', 'CLIENT_ID', 'CLIENT_SECRET',
  'ACTOR_ID', 'CREDENTIAL_ID', 'USER_ID', 'RETURN_URL', 'BOOT_TOKEN', 'AGENT_ID',
])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.vitepress') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

// 豁免。
//
// 有一类正当引用会撞上这条守卫：**描述一个已经修掉的旧路径**
// （「它们曾经共用前缀，于是产生了 /api/users/users/:user_id」）。
//
// 用行内注释显式豁免，而不是在脚本里藏一张名单 —— 名单会越攒越长，
// 而且看的人不知道每一条为什么在那儿。写在被豁免的那一行旁边，
// 理由和引用摆在一起。
//
//     <!-- cite-exempt: 描述已修复的旧路径 -->
// 必须带理由：`<!-- cite-exempt: 为什么 -->`。空标记等于一张没人敢删的名单。
const EXEMPT = /<!--\s*cite-exempt:\s*\S/

const errors = []
let checked = 0
let exempted = 0

for (const file of walk(DOCS)) {
  const rel = relative(DOCS, file)
  const raw = readFileSync(file, 'utf8')
  // 逐行剔除带豁免标记的行，其余照常校验。
  const lines = raw.split('\n')
  const kept = lines.filter((l) => !EXEMPT.test(l))
  exempted += lines.length - kept.length
  const body = kept.join('\n')

  for (const raw of body.match(/\/api\/[a-z0-9/_.:$-]+/gi) ?? []) {
    const cited = raw.replace(/[.,;)`"']+$/, '').replace(/\/$/, '').replace(/\/\$[A-Z_]+/g, '/:x')
    if (prefixes.has(cited)) continue
    checked++
    if (!pathMatchers.some((m) => m.test(cited))) {
      errors.push(`${rel}: \`${raw}\` 不在 openapi.yaml 里`)
    }
  }

  for (const key of body.match(/`([A-Z][A-Z0-9_]{4,})`/g) ?? []) {
    const name = key.slice(1, -1)
    if (!name.includes('_') || NOT_OURS.test(name) || SHELL_VARS.has(name)) continue
    checked++
    if (!realKeys.has(name)) {
      errors.push(`${rel}: \`${name}\` 不是 configuration.yaml 里的配置项`)
    }
  }

  for (const perm of body.match(/soulauth:[a-z_0-9.]+/g) ?? []) {
    checked++
    if (!realPerms.has(perm)) errors.push(`${rel}: \`${perm}\` 不在 permissions.yaml 里`)
  }
}

if (errors.length) {
  console.error('✗ 引用检查未通过：\n')
  for (const e of [...new Set(errors)]) console.error('  • ' + e)
  process.exit(1)
}
console.log(
  `✓ 散文里 ${checked} 处端点 / 配置项 / 权限名引用，全部对得上契约` +
    (exempted ? `（${exempted} 行显式豁免）` : ''),
)
