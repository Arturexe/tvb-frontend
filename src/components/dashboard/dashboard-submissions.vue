<script setup>
defineProps({ submissions: { type: Array, required: true } })
defineEmits(['new-submission', 'view-submission'])

const stats = [
  { label: 'Total Submissions', value: '4' },
  { label: 'Authentic', value: '2' },
  { label: 'In Review', value: '1' },
  { label: 'Certificates Issued', value: '3' },
]
const headings = ['Certificate No.', 'Item', 'Status', 'Date', 'Tier', '']
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24"><div class="mx-auto max-w-5xl"><div class="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="small-caps mb-1 font-sans-dm text-xs text-(--primary)">Client Portal</p><h1 class="font-display text-3xl font-semibold">Your Submissions</h1></div><app-button class="px-6 py-2.5" @click="$emit('new-submission')">+ New Submission</app-button></div><div class="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4"><article v-for="stat in stats" :key="stat.label" class="border border-(--border) bg-(--card) p-6"><p class="mb-1 font-display text-3xl font-semibold text-(--primary)">{{ stat.value }}</p><p class="font-sans-dm text-xs text-(--muted-foreground)">{{ stat.label }}</p></article></div><div class="overflow-x-auto border border-(--border) bg-(--card)"><h2 class="border-b border-(--border) px-6 py-4 font-display text-base font-semibold">Authentication History</h2><table class="w-full min-w-[720px]"><thead><tr class="border-b border-(--border)"><th v-for="heading in headings" :key="heading" class="px-6 py-3 text-left font-sans-dm text-xs font-normal tracking-widest text-(--muted-foreground)">{{ heading }}</th></tr></thead><tbody><tr v-for="submission in submissions" :key="submission.id" class="border-b border-(--border) last:border-0"><td class="px-6 py-4 font-sans-dm text-xs text-(--muted-foreground)">{{ submission.id }}</td><td class="px-6 py-4"><p class="font-sans-dm text-sm">{{ submission.item }}</p><p class="font-sans-dm text-xs text-(--muted-foreground)">{{ submission.brand }}</p></td><td class="px-6 py-4"><submission-status :status="submission.status" /></td><td class="px-6 py-4 font-sans-dm text-sm text-(--muted-foreground)">{{ submission.date }}</td><td class="px-6 py-4 font-sans-dm text-xs text-(--muted-foreground)">{{ submission.tier }}</td><td class="px-6 py-4"><button class="border-b border-(--primary) font-sans-dm text-xs text-(--primary)" @click="$emit('view-submission', submission)">View</button></td></tr></tbody></table></div></div></section>
</template>
