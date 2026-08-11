<script setup>
defineProps({ status: { type: String, required: true } })

const classes = {
  Authentic: 'bg-[rgba(154,120,64,.12)] text-(--primary)',
  'In Review': 'bg-[rgba(26,20,16,.08)] text-(--muted-foreground)',
  'Not Authentic': 'bg-[rgba(120,40,40,.1)] text-[#8b3030]',
}
</script>

<template>
  <span class="small-caps px-3 py-1 font-sans-dm text-xs" :class="classes[status] || classes['In Review']">{{ status }}</span>
</template>
