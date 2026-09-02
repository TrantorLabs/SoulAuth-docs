<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import PERMS from '../../data/contracts/permissions.json'
import { inlineMarkdown } from './inline'

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

interface Perm {
  name: string
  constant: string
  description: string
  status: string
  enforced_at?: string[]
}
const perms = computed<Perm[]>(() => (PERMS as any).permissions ?? [])

// 见 ConfigTable 里同名函数的说明。
function loc(o: any, field: string): string | undefined {
  return (zh.value ? o?.[`${field}_zh`] : undefined) ?? o?.[field]
}
</script>

<template>
  <div class="pm">
    <div class="pm-count">
      {{ perms.length }} {{ zh ? '条权限' : 'permissions' }}
      · {{ zh ? '前缀 soulauth: 不是装饰：它保证这些串不会被错认成 OS 级授权' : 'the soulauth: prefix keeps these from being mistaken for OS-level authority' }}
    </div>

    <dl>
      <template v-for="p in perms" :key="p.name">
        <dt>
          <code class="pm-name">{{ p.name }}</code>
          <Status :kind="(p.status as any)" glossary />
        </dt>
        <dd>
          <p v-html="inlineMarkdown(loc(p, 'description'))" />
          <details v-if="p.enforced_at?.length">
            <summary>
              {{ zh ? `在 ${p.enforced_at.length} 个 handler 上被检查` : `Checked in ${p.enforced_at.length} handlers` }}
            </summary>
            <ul>
              <li v-for="h in p.enforced_at" :key="h"><code>{{ h }}</code></li>
            </ul>
          </details>
          <p v-else class="pm-unused">
            {{ zh
              ? '没有任何 handler 检查它 —— 授予了也零效果。conformance::j1 会因此变红。'
              : 'No handler checks it — granting it has no effect. conformance::j1 would go red.' }}
          </p>
        </dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.pm { margin: 18px 0; }
.pm-count { margin-bottom: 16px; color: var(--vp-c-text-3); font-size: 13px; }
.pm dl { margin: 0; }
.pm dt { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; margin-top: 16px; }
.pm-name { padding: 0; background: none; font-size: 13.5px; font-weight: 600; }
.pm dd { margin: 4px 0 0; padding-left: 14px; border-left: 2px solid var(--vp-c-divider); }
.pm dd p { margin: 0; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6; }
.pm-unused { color: var(--vp-c-danger-1) !important; }
.pm details { margin-top: 4px; }
.pm summary { color: var(--vp-c-text-3); font-size: 13px; cursor: pointer; }
.pm ul { margin: 6px 0 0; padding-left: 18px; }
.pm li { color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
.pm li code { font-size: 12px; }
</style>
