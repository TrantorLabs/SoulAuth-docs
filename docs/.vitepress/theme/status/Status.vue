<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { WORDS, type StatusKind } from './words'

const props = defineProps<{
  /** 六个状态词之一（外加 planned）。 */
  kind: StatusKind
  /**
   * 守住这条声称的断言名，例如 `conformance::j8`。
   *
   * 留空不是「没有证据」的委婉说法 —— `tested` / `conformant` 两级**必须**
   * 给出它，见下面的 `unproven` 判定。
   */
  guard?: string
  /**
   * 这一处是在**解释这个词**，不是在声称某项能力到了这一级。
   *
   * 需要这个区分，是因为下面的 `unproven` 检查会对无守卫的 `tested` /
   * `conformant` 报警 —— 而词汇表里逐个列出六个词时，每一个都无守卫，
   * 报警就成了噪声，读者很快学会无视它，真警告也一起被无视了。
   */
  glossary?: boolean
}>()

const { lang } = useData()
const loc = computed<'en' | 'zh'>(() => (lang.value.startsWith('zh') ? 'zh' : 'en'))
const word = computed(() => WORDS[props.kind])

/**
 * 声称到了「有测试」以上却拿不出守卫名字 —— 这正是徽章要防的那件事。
 *
 * 不静默降级：静默会让一个空洞的 `tested` 看起来和有证据的一样可信。
 */
const unproven = computed(
  () =>
    !props.glossary &&
    (props.kind === 'tested' || props.kind === 'conformant') &&
    !props.guard,
)

const open = ref(false)
</script>

<template>
  <span class="st" :class="[`st--${word.tone}`, { 'st--bad': unproven }]">
    <button
      class="st-pill"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="st-dot" aria-hidden="true" />
      {{ word.label[loc] }}
      <code v-if="guard" class="st-guard">{{ guard }}</code>
      <span v-if="unproven" class="st-warn" :title="loc === 'zh'
        ? '声称到了这一级却没有守卫名字'
        : 'claimed at this level with no named guard'">!</span>
    </button>
    <span v-if="open" class="st-meaning" v-html="word.meaning[loc]" />
  </span>
</template>

<style scoped>
/* 行内元素：徽章跟在句子里，不该把行高撑开。 */
.st {
  display: inline;
}

.st-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 1px 8px 2px;
  border: 1px solid var(--st-line);
  border-radius: 999px;
  background: var(--st-bg);
  color: var(--st-fg);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
  /* 徽章会紧跟在中文标点后面，避免被当成断行点 */
  white-space: nowrap;
}
.st-pill:hover { border-color: var(--st-fg); }

.st-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--st-fg);
  /* baseline 对齐会让圆点吊在字上方，往下压一点 */
  transform: translateY(-1px);
}

.st-guard {
  padding: 0;
  background: none;
  color: inherit;
  opacity: 0.72;
  font-size: 11px;
}
.st-guard::before { content: '· '; }

.st-warn {
  font-weight: 700;
  color: var(--vp-c-danger-1);
}

/* 展开的释义另起一段：它是完整判定，塞进 title 属性读不了也搜不到。 */
.st-meaning {
  display: block;
  margin: 6px 0 10px;
  padding: 8px 12px;
  border-left: 2px solid var(--st-line);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

/* ── 色板 ──
   六个词的强度差别必须一眼看见，否则徽章只是装饰。
   浅色是弱，饱和是强。 */
.st--neutral { --st-fg: #6b7280; --st-bg: rgba(107,114,128,.10); --st-line: rgba(107,114,128,.30); }
.st--live    { --st-fg: #2f7d5b; --st-bg: rgba(47,125,91,.10);   --st-line: rgba(47,125,91,.32); }
.st--proven  { --st-fg: #3b5bd0; --st-bg: rgba(59,91,208,.10);   --st-line: rgba(59,91,208,.32); }
.st--strong  { --st-fg: #7a3ec7; --st-bg: rgba(122,62,199,.10);  --st-line: rgba(122,62,199,.32); }
.st--muted   { --st-fg: #8a8f98; --st-bg: transparent;           --st-line: rgba(138,143,152,.42); }
.st--warn    { --st-fg: #a4610a; --st-bg: rgba(164,97,10,.10);   --st-line: rgba(164,97,10,.32); }

/* 深色。
   VitePress 的主题切换是给 <html> 加 `.dark` 类，不是 data-theme 属性 ——
   首版按后者写，24 条规则一条都没生效，浅色配色原样留在深底上。
   这类错误只有真的切到深色看一眼才会发现。 */
.dark .st--live    { --st-fg: #5fbf92; }
.dark .st--proven  { --st-fg: #8ba3f5; }
.dark .st--strong  { --st-fg: #b98cf0; }
.dark .st--warn    { --st-fg: #d9a05b; }
.dark .st--neutral { --st-fg: #9aa1ad; }

.dark .st--live    { --st-fg: #5fbf92; }
.dark .st--proven  { --st-fg: #8ba3f5; }
.dark .st--strong  { --st-fg: #b98cf0; }
.dark .st--warn    { --st-fg: #d9a05b; }
.dark .st--neutral { --st-fg: #9aa1ad; }

.st--bad .st-pill { border-color: var(--vp-c-danger-1); }
</style>
