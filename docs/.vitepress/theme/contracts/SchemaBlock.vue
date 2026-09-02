<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import OPENAPI from '../../data/contracts/openapi.json'

const props = defineProps<{
  /** `#/components/schemas/X` 或内联 schema */
  schema: any
  /** 递归深度。展开是有限的：对象图有环，而且展开三层以外没人读。 */
  depth?: number
}>()

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

const SCHEMAS = (OPENAPI as any).components?.schemas ?? {}
const MAX_DEPTH = 2

function deref(s: any): any {
  if (s?.$ref) return SCHEMAS[s.$ref.split('/').pop()] ?? {}
  return s ?? {}
}

const name = computed(() => (props.schema?.$ref ?? '').split('/').pop() || null)
const resolved = computed(() => deref(props.schema))

interface Row {
  key: string
  type: string
  required: boolean
  ref: string | null
  nested: any | null
}

const rows = computed<Row[]>(() => {
  const s = resolved.value
  // 数组：展开它的元素类型，标注在表头
  const target = s.type === 'array' ? deref(s.items) : s
  const req: string[] = target.required ?? []
  return Object.entries<any>(target.properties ?? {}).map(([key, v]) => {
    const isArr = v.type === 'array'
    const inner = isArr ? v.items ?? {} : v
    const ref = (inner.$ref ?? '').split('/').pop() || null
    const base = ref ?? inner.type ?? 'object'
    return {
      key,
      type: (isArr ? `${base}[]` : base) + (inner.format ? ` (${inner.format})` : ''),
      required: req.includes(key),
      ref,
      nested: ref && (props.depth ?? 0) < MAX_DEPTH ? { $ref: `#/components/schemas/${ref}` } : null,
    }
  })
})

const isArray = computed(() => resolved.value?.type === 'array')
</script>

<template>
  <div class="sc">
    <div v-if="name" class="sc-name">
      <code>{{ name }}</code><span v-if="isArray" class="sc-arr">[]</span>
    </div>
    <table v-if="rows.length" class="sc-table">
      <tbody>
        <tr v-for="r in rows" :key="r.key">
          <td class="sc-k">
            <code>{{ r.key }}</code>
            <span v-if="r.required" class="sc-req" title="required">*</span>
          </td>
          <td class="sc-t">{{ r.type }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="sc-opaque">
      {{ zh
        ? '契约未进一步细分这个形状：该端点的响应体由运行时组装，不是一个具名结构体。'
        : 'The contract does not specify this shape further — the response is assembled at runtime rather than from a named struct.' }}
    </p>

    <details v-for="r in rows.filter((x) => x.nested)" :key="`n-${r.key}`" class="sc-nest">
      <summary><code>{{ r.key }}</code> · {{ r.type }}</summary>
      <SchemaBlock :schema="r.nested" :depth="(depth ?? 0) + 1" />
    </details>
  </div>
</template>

<style scoped>
.sc { margin: 4px 0 0; }
.sc-name { margin-bottom: 4px; }
.sc-name code { padding: 0; background: none; font-size: 12px; color: var(--vp-c-text-3); }
.sc-arr { color: var(--vp-c-text-3); font-size: 12px; }
.sc-table { width: auto; border-collapse: collapse; font-size: 13px; }
.sc-table td { padding: 2px 16px 2px 0; border: 0; vertical-align: top; }
.sc-k code { padding: 0; background: none; font-size: 12.5px; }
.sc-req { color: var(--vp-c-danger-1); font-weight: 700; }
.sc-t { color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); font-size: 12px; }
.sc-opaque { margin: 0; color: var(--vp-c-text-3); font-size: 13px; }
.sc-nest { margin-top: 6px; }
.sc-nest summary { color: var(--vp-c-text-3); font-size: 12.5px; cursor: pointer; }
.sc-nest summary code { padding: 0; background: none; font-size: 12px; }
</style>
