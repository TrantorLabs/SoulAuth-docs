<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import OPENAPI from '../../data/contracts/openapi.json'
import { inlineMarkdown } from './inline'
import SchemaBlock from './SchemaBlock.vue'

const props = defineProps<{
  /** 只渲染这个 tag 下的端点；留空则全部。 */
  tag?: string
}>()

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

interface Param {
  name: string
  in: string
  required: boolean
  type: string
}

interface Row {
  method: string
  path: string
  operationId: string
  description?: string
  schemes: string[]
  permission?: string
  params: Param[]
  requestSchema: any | null
  responseSchema: any | null
  responseCode: string
}

const METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const paths = (OPENAPI as any).paths ?? {}
  for (const [path, methods] of Object.entries<any>(paths)) {
    for (const [method, op] of Object.entries<any>(methods)) {
      if (props.tag && !(op.tags ?? []).includes(props.tag)) continue
      out.push({
        method: method.toUpperCase(),
        path,
        operationId: op.operationId,
        // 见 ConfigTable：zh 优先 `_zh`，回落英文。
        description: (zh.value ? op['description_zh'] : undefined) ?? op.description,
        // `security: []` 是「显式公开」，与「没写 security」不同 —— 前者是
        // 声明，后者是遗漏。契约里两者都不该出现在同一份表里而不加区分。
        schemes: (op.security ?? []).flatMap((s: any) => Object.keys(s)),
        permission: (op['x-required-permissions'] ?? [])[0],
        params: (op.parameters ?? []).map((x: any) => ({
          name: x.name,
          in: x.in,
          required: !!x.required,
          type: x.schema?.type ?? 'string',
        })),
        requestSchema: op.requestBody?.content?.['application/json']?.schema ?? null,
        // 只渲染成功响应。错误形状全站统一，重复 84 遍没有信息量 ——
        // 它写在 API 约定那一页。
        responseSchema:
          (op.responses?.['200'] ?? op.responses?.[200])?.content?.['application/json']?.schema ??
          null,
        responseCode: op.responses?.['204'] || op.responses?.[204] ? '204' : '200',
      })
    }
  }
  return out.sort(
    (a, b) =>
      a.path.localeCompare(b.path) ||
      METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method),
  )
})

const SCHEME_LABEL: Record<string, { en: string; zh: string; hint: { en: string; zh: string } }> = {
  bearerAuth: {
    en: 'session token',
    zh: '会话令牌',
    hint: {
      en: 'Authorization: Bearer — from POST /api/auth/login or POST /api/actors/authenticate',
      zh: 'Authorization: Bearer —— 来自 POST /api/auth/login 或 POST /api/actors/authenticate',
    },
  },
  oidcAccessToken: {
    en: 'OIDC access token',
    zh: 'OIDC 访问令牌',
    hint: {
      en: 'Authorization: Bearer — from POST /api/oidc/token. Not interchangeable with a session token.',
      zh: 'Authorization: Bearer —— 来自 POST /api/oidc/token。与会话令牌不可互换。',
    },
  },
  browserSession: {
    en: 'browser cookie',
    zh: '浏览器 cookie',
    hint: {
      en: 'soulauth_session cookie. Absent means a redirect to the login page, not a 401.',
      zh: 'soulauth_session cookie。没有它是重定向到登录页，不是 401。',
    },
  },
}

const openRow = ref<string | null>(null)
function toggle(id: string) {
  openRow.value = openRow.value === id ? null : id
}
</script>

<template>
  <div class="api">
    <div class="api-count">
      {{ rows.length }} {{ zh ? '个端点' : rows.length === 1 ? 'endpoint' : 'endpoints' }}
    </div>
    <div class="api-scroll">
      <table class="api-table">
        <thead>
          <tr>
            <th>{{ zh ? '端点' : 'Endpoint' }}</th>
            <th>{{ zh ? '需要' : 'Requires' }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in rows" :key="r.operationId">
            <tr :class="{ 'api-open': openRow === r.operationId }">
              <td class="api-ep">
                <button class="api-btn" type="button" @click="toggle(r.operationId)">
                  <span class="api-m" :class="`api-m--${r.method.toLowerCase()}`">{{ r.method }}</span>
                  <code class="api-p">{{ r.path }}</code>
                </button>
              </td>
              <td class="api-req">
                <span v-if="!r.schemes.length" class="api-pub">{{ zh ? '公开' : 'public' }}</span>
                <template v-else>
                  <span
                    v-for="s in r.schemes"
                    :key="s"
                    class="api-scheme"
                    :title="SCHEME_LABEL[s]?.hint[zh ? 'zh' : 'en'] ?? s"
                    >{{ SCHEME_LABEL[s]?.[zh ? 'zh' : 'en'] ?? s }}</span
                  >
                  <code v-if="r.permission" class="api-perm">{{ r.permission }}</code>
                </template>
              </td>
            </tr>
            <!-- v-show 而不是 v-if：详情要留在 DOM 里。
                 用 v-if 的话，参数与 schema 不进静态 HTML —— 既无法在构建产物上
                 核验，禁用 JS 的读者也完全看不到这份 API 参考的实质内容。 -->
            <tr v-show="openRow === r.operationId" class="api-detail">
              <td colspan="2">
                <p v-if="r.description" v-html="inlineMarkdown(r.description)" />

                <div v-if="r.params.length" class="api-sec">
                  <div class="api-h">{{ zh ? '参数' : 'Parameters' }}</div>
                  <table class="api-params">
                    <tbody>
                      <tr v-for="p in r.params" :key="p.in + p.name">
                        <td><code>{{ p.name }}</code><span v-if="p.required" class="api-star">*</span></td>
                        <td class="api-dim">{{ p.in }}</td>
                        <td class="api-dim">{{ p.type }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-if="r.requestSchema" class="api-sec">
                  <div class="api-h">{{ zh ? '请求体' : 'Request body' }}</div>
                  <SchemaBlock :schema="r.requestSchema" />
                </div>

                <div class="api-sec">
                  <div class="api-h">
                    {{ zh ? '响应' : 'Response' }}
                    <code class="api-code">{{ r.responseCode }}</code>
                  </div>
                  <SchemaBlock v-if="r.responseSchema" :schema="r.responseSchema" />
                  <p v-else class="api-dim">
                    {{ r.responseCode === '204'
                      ? (zh ? '无响应体。' : 'No body.')
                      : (zh ? '响应体形状未在契约中细分。' : 'Body shape is not further specified in the contract.') }}
                  </p>
                </div>

                <p class="api-errnote">
                  {{ zh
                    ? '错误响应全站同形，见 API 约定。'
                    : 'Errors share one shape across the API — see API conventions.' }}
                </p>
                <code class="api-oid">operationId: {{ r.operationId }}</code>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.api { margin: 18px 0 26px; }
.api-count { margin-bottom: 8px; color: var(--vp-c-text-3); font-size: 13px; }
.api-scroll { overflow-x: auto; }
.api-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.api-table th {
  padding: 6px 10px 6px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.api-table td { padding: 0; border-bottom: 1px solid var(--vp-c-divider); vertical-align: top; }

.api-btn {
  display: flex;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  padding: 8px 10px 8px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.api-m {
  flex: 0 0 auto;
  min-width: 4.2em;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.api-m--get { color: #2f7d5b; }
.api-m--post { color: #3b5bd0; }
.api-m--put { color: #a4610a; }
.api-m--delete { color: #b4342c; }
.dark .api-m--get { color: #5fbf92; }
.dark .api-m--post { color: #8ba3f5; }
.dark .api-m--put { color: #d9a05b; }
.dark .api-m--delete { color: #e88a82; }
.dark .api-m--get { color: #5fbf92; }
.dark .api-m--post { color: #8ba3f5; }
.dark .api-m--put { color: #d9a05b; }
.dark .api-m--delete { color: #e88a82; }

.api-p { padding: 0; background: none; font-size: 13px; overflow-wrap: break-word; }
.api-req { padding: 8px 0 8px 10px; white-space: nowrap; }
.api-pub { color: var(--vp-c-text-3); font-size: 13px; }
.api-scheme { color: var(--vp-c-text-2); font-size: 13px; border-bottom: 1px dotted var(--vp-c-divider); cursor: help; }
.api-perm { display: block; margin-top: 2px; padding: 0; background: none; font-size: 11.5px; color: var(--vp-c-text-3); }

.api-detail td { padding: 0 0 12px 10px; }
.api-detail p { margin: 0 0 6px; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6; }
.api-sec { margin-top: 10px; }
.api-h {
  color: var(--vp-c-text-3);
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 3px;
}
.api-code { padding: 0 4px; font-size: 11px; }
.api-params { width: auto; border-collapse: collapse; font-size: 13px; }
.api-params td { padding: 2px 16px 2px 0; border: 0; }
.api-params code { padding: 0; background: none; font-size: 12.5px; }
.api-star { color: var(--vp-c-danger-1); font-weight: 700; }
.api-dim { color: var(--vp-c-text-3); font-size: 12.5px; font-family: var(--vp-font-family-mono); }
.api-errnote { margin: 10px 0 4px !important; color: var(--vp-c-text-3) !important; font-size: 12.5px !important; }
.api-oid { padding: 0; background: none; font-size: 11.5px; color: var(--vp-c-text-3); }

@media (max-width: 620px) {
  .api-table thead { display: none; }
  .api-table tr { display: block; }
  .api-table td { display: block; }
  .api-req { padding: 0 0 8px 10px; white-space: normal; }
}
</style>
