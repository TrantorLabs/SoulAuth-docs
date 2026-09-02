<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import CONFIG from '../../data/contracts/configuration.json'
import { inlineMarkdown } from './inline'

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

interface Key {
  name: string
  description_zh?: string
  required?: boolean | string
  default?: string
  description?: string
}
interface Group {
  id: string
  note?: string
  note_zh?: string
  keys: Key[]
}

const groups = computed<Group[]>(() => (CONFIG as any).groups ?? [])

// 契约以英文为主语言，中文放在 `*_zh`。中文站取不到 `_zh` 时回落英文而不是留空
// —— 少一句英文说明，比一个空白格子有用。
function loc(o: any, field: string): string | undefined {
  return (zh.value ? o?.[`${field}_zh`] : undefined) ?? o?.[field]
}
const total = computed(() => groups.value.reduce((n, g) => n + g.keys.length, 0))

// `required` 有三态：true / false / "conditional"。把 conditional 铺平成
// false 会让生产闸门那几项看起来可选 —— 而少配它们进程直接拒绝启动。
function requirement(k: Key): { label: string; tone: string } {
  if (k.required === true) return { label: zh.value ? '必填' : 'required', tone: 'req' }
  if (typeof k.required === 'string')
    return { label: zh.value ? '条件必填' : 'conditional', tone: 'cond' }
  return { label: zh.value ? '可选' : 'optional', tone: 'opt' }
}
</script>

<template>
  <div class="cfg">
    <div class="cfg-count">
      {{ total }} {{ zh ? '个环境变量' : 'environment variables' }}
      · {{ zh ? '唯一来源是进程环境变量；不支持配置文件或运行期重载' : 'environment only; no config file, no runtime reload' }}
    </div>

    <section v-for="g in groups" :key="g.id" class="cfg-group">
      <h3 :id="`cfg-${g.id}`">{{ g.id }}</h3>
      <p v-if="loc(g, 'note')" class="cfg-note" v-html="inlineMarkdown(loc(g, 'note'))" />

      <dl>
        <template v-for="k in g.keys" :key="k.name">
          <dt>
            <code class="cfg-name">{{ k.name }}</code>
            <span class="cfg-req" :class="`cfg-req--${requirement(k).tone}`">{{ requirement(k).label }}</span>
            <code v-if="k.default !== undefined" class="cfg-def">= {{ k.default || (zh ? '（空）' : '(empty)') }}</code>
          </dt>
          <dd v-if="loc(k, 'description')" v-html="inlineMarkdown(loc(k, 'description'))" />
        </template>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.cfg { margin: 18px 0 8px; }
.cfg-count { margin-bottom: 18px; color: var(--vp-c-text-3); font-size: 13px; }
.cfg-group { margin-bottom: 30px; }
.cfg-group h3 {
  margin: 0 0 4px;
  padding: 0;
  border: 0;
  font-size: 15px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}
.cfg-note { margin: 0 0 12px; color: var(--vp-c-text-2); font-size: 13.5px; line-height: 1.6; }
.cfg dl { margin: 0; }
.cfg dt {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-top: 12px;
}
.cfg-name { padding: 0; background: none; font-size: 13.5px; font-weight: 600; }
.cfg-req {
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
  line-height: 1.7;
  white-space: nowrap;
}
.cfg-req--req  { background: rgba(180, 52, 44, .12); color: #b4342c; }
.cfg-req--cond { background: rgba(164, 97, 10, .12); color: #a4610a; }
.cfg-req--opt  { background: var(--vp-c-bg-soft); color: var(--vp-c-text-3); }
.dark .cfg-req--req  { color: #e88a82; }
.dark .cfg-req--cond { color: #d9a05b; }
.dark .cfg-req--req  { color: #e88a82; }
.dark .cfg-req--cond { color: #d9a05b; }
.cfg-def { padding: 0; background: none; font-size: 12px; color: var(--vp-c-text-3); }
.cfg dd {
  margin: 3px 0 0;
  padding-left: 14px;
  border-left: 2px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}
</style>
