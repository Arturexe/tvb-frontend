<script setup>

const props = defineProps({ mode: { type: String, required: true } })
const emit = defineEmits(['submit'])

const auth = ref({ name: '', email: '', password: '' })
const isLogin = computed(() => props.mode === 'login')

function submit() {
  emit('submit', auth.value)
}
</script>

<template>
  <section class="flex min-h-screen items-center justify-center px-6 pb-20 pt-24">
    <div class="w-full max-w-sm">
      <div class="mb-10 text-center"><app-logo :size="52" :show-name="false" class="justify-center" /><h1 class="mt-4 font-display text-2xl font-semibold">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h1><p class="mt-2 font-sans-dm text-sm text-(--muted-foreground)">{{ isLogin ? 'Sign in to view your certificates' : 'Start submitting items for authentication' }}</p></div>
      <form class="border border-(--border) bg-(--card) p-8" @submit.prevent="submit">
        <div class="space-y-5"><label v-if="!isLogin"><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Full Name</span><input v-model="auth.name" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Email Address</span><input v-model="auth.email" type="email" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Password</span><input v-model="auth.password" type="password" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label></div>
        <button v-if="isLogin" type="button" class="mt-2 block w-full text-right font-sans-dm text-xs text-(--primary)">Forgot password?</button>
        <app-button type="submit" class="mt-6 w-full py-3">{{ isLogin ? 'Sign In' : 'Create Account' }}</app-button>
        <div class="rule-gold my-6" /><p class="text-center font-sans-dm text-xs text-(--muted-foreground)">{{ isLogin ? "Don't have an account?" : 'Already have an account?' }} <router-link :to="isLogin ? '/register' : '/login'" class="text-(--primary)">{{ isLogin ? 'Create one' : 'Sign in' }}</router-link></p>
      </form>
    </div>
  </section>
</template>
