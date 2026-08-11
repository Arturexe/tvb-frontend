<template>
  <footer class="border-t border-(--border) bg-(--secondary)">
    <div class="mx-auto max-w-6xl px-6 py-16">
      <div class="grid gap-10 md:grid-cols-4">
        <div class="md:col-span-2">
          <div class="mb-4 flex items-center gap-3"><app-logo :size="32" :show-name="false" /><span
              class="font-display text-sm font-semibold tracking-widest">THE VERIFIED BAG</span></div>
          <p class="max-w-xs font-sans-dm text-sm leading-relaxed text-(--muted-foreground)">An independent
            authentication service specializing in luxury handbags. We are not affiliated with any brand.</p>
        </div>
        <div>
          <p class="small-caps mb-4 font-sans-dm text-xs text-(--primary)">Services</p><router-link
            v-for="link in [{ label: 'Authenticate', to: '/authenticate' }, { label: 'Valuate', to: '/valuate' }, { label: 'Pricing', to: '/pricing' }, { label: 'Verify Certificate', to: '/verify' }, { label: 'How It Works', to: '/' }]"
            :key="link.to" :to="link.to" class="mb-2 block font-sans-dm text-sm text-(--muted-foreground)">{{ link.label
            }}</router-link>
        </div>
        <div>
          <p class="small-caps mb-4 font-sans-dm text-xs text-(--primary)">Contact</p>
          <p class="mb-2 font-sans-dm text-sm text-(--muted-foreground)">theverifiedbag.com</p>
          <p class="font-sans-dm text-sm text-(--muted-foreground)">support@theverifiedbag.com</p>
        </div>
      </div>
      <div class="rule-gold mb-6 mt-10" />
      <div class="flex flex-col items-center justify-between gap-3 md:flex-row">
        <p class="font-sans-dm text-xs text-(--muted-foreground)">Copyright 2026 The Verified Bag. All rights reserved.
        </p>
        <div class="flex gap-6 font-sans-dm text-xs text-(--muted-foreground)"><span>Privacy Policy</span><span>Terms of
            Service</span></div>
      </div>
    </div>
  </footer>
</template>
