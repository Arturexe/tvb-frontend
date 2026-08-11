<script setup>
defineProps({ certificateImage: { type: String, required: true } })
defineEmits(['submit', 'pricing'])
</script>

<template>
  <section class="relative flex min-h-screen items-center overflow-hidden">
    <div class="absolute inset-0 opacity-[.04]"
      style="background-image: repeating-linear-gradient(0deg, var(--foreground) 0, var(--foreground) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, var(--foreground) 0, var(--foreground) 1px, transparent 1px, transparent 60px)" />
    <div class="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 pb-20 pt-24 lg:grid-cols-2">
      <div>
        <div class="mb-8 flex items-center gap-3"><span class="rule-gold w-12" /><span
            class="font-sans-dm text-xs tracking-[.2em] text-(--primary)">INDEPENDENT AUTHENTICATION</span></div>
        <h1 class="mb-6 font-display text-5xl font-semibold leading-tight text-(--foreground) lg:text-6xl">Know
          Before<br><em class="text-(--primary)">You Buy.</em></h1>
        <p class="mb-10 max-w-[420px] font-sans-dm text-base leading-relaxed text-(--muted-foreground)">The
          Verified Bag provides expert, independent authentication for luxury handbags, issuing a formal certificate you
          can trust, share, and rely on.</p>
        <div class="flex flex-wrap gap-4"><app-button class="px-8 py-3.5" @click="$emit('submit')">Submit for
            Authentication</app-button><app-button variant="outline" class="px-8 py-3.5" @click="$emit('pricing')">View
            Pricing</app-button></div>
        <div class="mt-12 flex gap-8 border-t border-(--border) pt-8">
          <div
            v-for="stat in [{ n: '2,400+', l: 'Certificates Issued' }, { n: '98.6%', l: 'Accuracy Rate' }, { n: '72hr', l: 'Average Turnaround' }]"
            :key="stat.l">
            <div class="font-display text-2xl font-semibold text-(--primary)">{{ stat.n }}</div>
            <div class="font-sans-dm text-xs text-(--muted-foreground)">{{ stat.l }}</div>
          </div>
        </div>
      </div>
      <div class="relative hidden justify-center lg:flex">
        <div class="max-w-[380px] border border-(--border) p-1 shadow-[0_20px_60px_rgba(26,20,16,.12)]"><img
            :src="certificateImage" alt="Sample authentication certificate"
            class="block w-full border border-(--border)" /></div>
        <div class="absolute -bottom-4 -left-4 bg-(--primary) px-5 py-3 text-(--primary-foreground)">
          <div class="font-display text-xl font-semibold italic">Authentic</div>
          <div class="font-sans-dm text-[10px] tracking-widest">VERIFIED CERTIFICATE</div>
        </div>
      </div>
    </div>
  </section>
</template>
