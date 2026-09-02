<script setup lang="ts">
// 错误码表。
//
// API Conventions 那页原本写着「完整枚举在 `contracts/openapi.yaml` 的
// components.schemas.Error 里」，然后就没有了。对读者而言这句话等于没说：
// 那个文件在另一个仓库，而**要读者去分支上翻 YAML 才能拿到的东西，
// 就是没有文档化**。偏偏它还是全站唯一一处明确要求「branch on it」的数据。
//
// 枚举本来就在契约快照里（openapi.json → components.schemas.Error），
// 和另外四张表同一份数据、同一个来源 commit。渲染它不需要任何新的数据源。
import { computed } from 'vue'
import { useData } from 'vitepress'
import OPENAPI from '../../data/contracts/openapi.json'
import { inlineMarkdown } from './inline'

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

const schema = computed<any>(() => (OPENAPI as any).components?.schemas?.Error ?? {})
const codes = computed<string[]>(() => schema.value.properties?.error?.enum ?? [])

/** `error` / `message` 之外的字段：只在特定错误上出现，是附加而非替换。 */
const extras = computed(() =>
  Object.entries<any>(schema.value.properties ?? {})
    .filter(([name]) => name !== 'error' && name !== 'message')
    .map(([name, spec]) => ({
      name,
      type: spec.type,
      description: (zh.value ? spec.description_zh : undefined) ?? spec.description,
    })),
)
</script>

<template>
  <div class="er">
    <div class="er-count">
      {{ codes.length }} {{ zh ? '个错误码' : 'error codes' }}
      ·
      {{ zh
        ? '按 error 分支，不要按 message —— message 的措辞任何版本都可能改'
        : 'branch on error, never on message — its wording can change in any release' }}
    </div>

    <ul class="er-codes">
      <li v-for="c in codes" :key="c"><code>{{ c }}</code></li>
    </ul>

    <p class="er-extra-lead">
      {{ zh
        ? '下面这些字段只出现在特定错误上，是在 error / message 之外附加的：'
        : 'These fields appear on specific errors only, added alongside error and message:' }}
    </p>
    <dl class="er-extras">
      <template v-for="e in extras" :key="e.name">
        <dt><code>{{ e.name }}</code> <span class="er-type">{{ e.type }}</span></dt>
        <dd v-html="inlineMarkdown(e.description)" />
      </template>
    </dl>
  </div>
</template>

<style scoped>
.er { margin: 18px 0 26px; }
.er-count { margin-bottom: 12px; color: var(--vp-c-text-3); font-size: 13px; }
.er-codes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2px 14px;
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
}
.er-codes li { margin: 0; }
.er-codes code { padding: 0; background: none; font-size: 13px; }
.er-extra-lead { margin: 0 0 6px; color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6; }
.er-extras { margin: 0; }
.er-extras dt { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
.er-extras dt code { padding: 0; background: none; font-size: 13.5px; font-weight: 600; }
.er-type { color: var(--vp-c-text-3); font-size: 12px; }
.er-extras dd {
  margin: 2px 0 0;
  padding-left: 14px;
  border-left: 2px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}
</style>
