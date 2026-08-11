<script setup>

const mobileOpen = ref(false)
const navLinks = [
  { label: 'Authenticate', to: '/authenticate' },
  { label: 'Valuate', to: '/valuate' },
  { label: 'Verify Certificate', to: '/verify' },
  { label: 'Pricing', to: '/pricing' },
]
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-(--border) bg-(--background)">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <router-link to="/" class="text-left" @click="mobileOpen = false"><app-logo /></router-link>
      <nav class="hidden items-center gap-8 md:flex"><router-link v-for="link in navLinks" :key="link.to" :to="link.to" class="font-sans-dm text-sm text-(--muted-foreground)" active-class="border-b border-(--primary) pb-0.5 text-(--primary)">{{ link.label }}</router-link></nav>
      <div class="hidden items-center gap-3 md:flex"><router-link to="/login" class="border border-(--border) px-5 py-2 font-sans-dm text-sm text-(--primary)">Sign In</router-link><router-link to="/authenticate" class="bg-(--primary) px-5 py-2 font-sans-dm text-sm text-(--primary-foreground)">Authenticate Item</router-link></div>
      <button class="flex flex-col gap-1.5 p-2 md:hidden" aria-label="Toggle menu" @click="mobileOpen = !mobileOpen"><span class="h-px w-5 bg-(--foreground)" /><span class="h-px w-5 bg-(--foreground)" /><span class="h-px w-3 bg-(--foreground)" /></button>
    </div>
    <div v-if="mobileOpen" class="flex flex-col gap-4 border-t border-(--border) bg-(--card) px-6 py-4 md:hidden"><router-link v-for="link in [...navLinks, { label: 'Sign In', to: '/login' }]" :key="link.to" :to="link.to" class="font-sans-dm text-sm" @click="mobileOpen = false">{{ link.label }}</router-link></div>
  </header>
</template>
