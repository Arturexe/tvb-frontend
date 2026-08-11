<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  disabled: Boolean,
})

defineEmits(['click'])

const variants = {
  primary: 'bg-(--primary) text-(--primary-foreground)',
  outline: 'border border-(--border) text-(--foreground)',
  goldOutline: 'border border-(--primary) text-(--primary)',
  muted: 'border border-(--border) text-(--muted-foreground)',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="font-sans-dm text-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
    :class="variants[variant] || variants.primary"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
