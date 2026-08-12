<script setup>
const props = defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    confirmLabel: { type: String, default: 'Confirm' },
    busyLabel: { type: String, default: 'Working...' },
    busy: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
const cancelButton = ref(null)

function cancel() {
    if (!props.busy) emit('cancel')
}

function handleKeydown(event) {
    if (event.key === 'Escape') cancel()
}

watch(
    () => props.open,
    async (open) => {
        if (!open) return
        await nextTick()
        cancelButton.value?.focus()
    }
)
</script>

<template>
    <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0">
        <div
            v-if="open"
            class="fixed inset-0 z-[70] grid place-items-center bg-(--background)/55 p-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            @click.self="cancel"
            @keydown="handleKeydown">
            <section
                class="w-full max-w-md border border-(--border) bg-(--card)/95 p-6 shadow-sm">
                <p class="small-caps text-xs text-(--primary)">Confirmation required</p>
                <h2 class="font-display mt-2 text-xl font-semibold">
                    {{ title }}
                </h2>
                <div class="mt-3 text-sm leading-6 text-(--muted-foreground)">
                    <slot />
                </div>
                <div class="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        ref="cancelButton"
                        :disabled="busy"
                        class="border border-(--border) px-4 py-2 text-sm text-(--muted-foreground) disabled:opacity-60"
                        @click="cancel">
                        Cancel
                    </button>
                    <button
                        :disabled="busy"
                        class="bg-(--primary) px-4 py-2 text-sm text-(--primary-foreground) disabled:opacity-60"
                        @click="emit('confirm')">
                        {{ busy ? busyLabel : confirmLabel }}
                    </button>
                </div>
            </section>
        </div>
    </transition>
</template>