<script setup lang="ts">
import type { Node } from './strings'
defineProps<{ n: Node; variant?: string }>()
</script>

<template>
  <div class="dg-box" :class="variant ? `dg-box--${variant}` : undefined">
    <b>{{ n.name }}</b>
    <span v-if="n.sub">{{ n.sub }}</span>
    <em v-if="n.note">{{ n.note }}</em>
  </div>
</template>
