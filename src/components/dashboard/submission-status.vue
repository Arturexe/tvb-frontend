<script setup>
defineProps({ status: { type: String, required: true } })

const classes = {
  Draft: 'bg-[rgba(154,120,64,.12)] text-(--primary)',
  Reviewing: 'bg-[rgba(26,20,16,.08)] text-(--muted-foreground)',
  Completed: 'bg-[rgba(154,120,64,.12)] text-(--primary)',
  'Awaiting Payment': 'bg-[rgba(26,20,16,.08)] text-(--muted-foreground)',
  Submitted: 'bg-[rgba(26,20,16,.08)] text-(--muted-foreground)',
  Queued: 'bg-[rgba(26,20,16,.08)] text-(--muted-foreground)',
  'Needs More Photos': 'bg-[rgba(120,40,40,.1)] text-[#8b3030]',
  Cancelled: 'bg-[rgba(120,40,40,.1)] text-[#8b3030]',
  Refunded: 'bg-[rgba(120,40,40,.1)] text-[#8b3030]',
}
</script>

<template>
  <span class="small-caps px-3 py-1 font-sans-dm text-xs" :class="classes[status] || classes.Submitted">{{ status }}</span>
</template>
