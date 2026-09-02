<script setup lang="ts">
// Figure 1 —— 渲染位图原稿。
//
// 图包在 <a> 里指向同一个文件：原图宽约 1600–2000px，而正文栏最多 688px，
// 缩到栏宽之后图里的小字只剩五六个像素，**任何页内宽度都读不清**。
// 点开看原图才是真正解决办法，页内那一版负责给出结构和位置。
//
// 顺带修好一处：承托底与边框的样式挂在 `figure.figure a` 上（见 custom.css），
// 上一版渲染裸 <img>，那层样式一直没生效。
//
// 标题与图注从 `strings.ts` 取 —— 它们是文字，烧进像素里就搜不到、
// 翻译不了，也无法被引用守卫检查。`t.zoom` 只用作 title 提示。
import { fig1 } from './strings'
import { withBase } from 'vitepress'
const props = defineProps<{ locale: 'en' | 'zh' }>()
const t = fig1[props.locale]
const src = withBase(`/figures/figure-1-soulseed-agi-infrastructure.${props.locale}.png`)
</script>

<template>
  <figure class="figure">
    <a :href="src" target="_blank" rel="noopener" :title="t.zoom">
      <img :src="src" :alt="t.title" loading="lazy" decoding="async" />
    </a>
    <figcaption><strong>{{ t.title }}</strong> — {{ t.caption }}</figcaption>
  </figure>
</template>
