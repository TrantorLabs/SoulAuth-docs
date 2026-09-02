<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import STD from '../../data/contracts/standards.json'
import { inlineMarkdown } from './inline'

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

interface Spec {
  id: string
  title: string
  role?: string
  implemented: boolean | string
  supported: boolean | string
  tested: boolean | string
  conformant: boolean | string
  certified: boolean | string
  scope?: string
  evidence?: string
  caveats?: { id: string; summary: string; detail: string; runtime?: string }[]
}

// 见 ConfigTable 里同名函数的说明。
function loc(o: any, field: string): string | undefined {
  return (zh.value ? o?.[`${field}_zh`] : undefined) ?? o?.[field]
}

const all = computed<Spec[]>(() => (STD as any).specifications ?? [])
// 分成两组。把「未实现」混在已实现里列，读者要逐行去看五个布尔值 ——
// 而「生态里容易被默认为存在」的那几条，正是最该一眼看见的。
const done = computed(() => all.value.filter((s) => s.implemented === true))

const FLAGS = ['implemented', 'supported', 'tested', 'conformant', 'certified'] as const
function flagKind(s: Spec, f: (typeof FLAGS)[number]): string | null {
  const v = (s as any)[f]
  return v === true ? f : null
}
</script>

<template>
  <div class="std">
    <h3>{{ zh ? '已实现' : 'Implemented' }}</h3>
    <div v-for="s in done" :key="s.id" class="std-item">
      <div class="std-head">
        <strong>{{ s.title }}</strong>
        <code>{{ s.id }}</code>
      </div>
      <div class="std-flags">
        <template v-for="f in FLAGS" :key="f">
          <Status v-if="flagKind(s, f)" :kind="f" glossary />
        </template>
      </div>
      <p v-if="loc(s, 'scope')" class="std-scope" v-html="inlineMarkdown(loc(s, 'scope'))" />
      <p v-if="s.evidence" class="std-ev">{{ zh ? '证据' : 'Evidence' }}: <code>{{ s.evidence }}</code></p>
      <details v-for="c in s.caveats ?? []" :key="c.id" class="std-caveat">
        <summary>{{ loc(c, 'summary') }}</summary>
        <p v-html="inlineMarkdown(loc(c, 'detail'))" />
        <p v-if="c.runtime" class="std-ev"><code>{{ c.runtime }}</code></p>
      </details>
    </div>
  </div>
</template>

<style scoped>
.std { margin: 18px 0; }
.std h3 { margin: 28px 0 10px; padding: 0; border: 0; font-size: 16px; }
.std h3:first-child { margin-top: 0; }
.std-lead { margin: 0 0 14px; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.65; }
.std-item {
  margin-bottom: 18px;
  padding-left: 14px;
  border-left: 2px solid var(--vp-c-divider);
}
.std-item--absent { opacity: 0.82; }
.std-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.std-head code { padding: 0; background: none; font-size: 12px; color: var(--vp-c-text-3); }
.std-flags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px; }
.std-scope { margin: 6px 0 0; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.65; }
.std-ev { margin: 4px 0 0; color: var(--vp-c-text-3); font-size: 12.5px; }
.std-ev code { font-size: 12px; }
.std-caveat { margin-top: 8px; }
.std-caveat summary { color: var(--vp-c-danger-1); font-size: 14px; cursor: pointer; }
.std-caveat p { margin: 6px 0 0; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.65; }
.std-not, .std-limits { margin-top: 8px; }
.std-not-h { color: var(--vp-c-text-3); font-size: 13px; }
.std ul { margin: 4px 0 0; padding-left: 18px; }
.std li { color: var(--vp-c-text-2); font-size: 13.5px; line-height: 1.7; }
.std-frozen { margin: 6px 0 0; }
.std-frozen dt { margin-top: 6px; }
.std-frozen dt code { font-size: 12px; }
.std-frozen dd { margin: 1px 0 0 14px; color: var(--vp-c-text-2); font-size: 13px; }
.std details summary { color: var(--vp-c-text-3); font-size: 13px; cursor: pointer; }
</style>
