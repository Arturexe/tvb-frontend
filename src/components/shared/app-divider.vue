<script setup>
defineProps({ label: { type: String, default: '' } })
</script>

<template>
  <div class="flex items-center gap-4">
    <span class="rule-gold flex-1" />
    <span v-if="label" class="small-caps font-sans-dm text-xs text-(--primary)">{{ label }}</span>
    <span v-else class="h-1.5 w-1.5 rotate-45 bg-(--primary)" />
    <span class="rule-gold flex-1" />
  </div>
</template>
