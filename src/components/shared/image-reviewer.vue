<script setup>
const props = defineProps({
    open: { type: Boolean, default: false },
    src: { type: String, default: '' },
    alt: { type: String, default: 'Image preview' },
})

const emit = defineEmits(['close'])
const zoom = ref(1)
const dialog = ref(null)
const imageOffset = ref({ x: 0, y: 0 })
const dragStart = ref(null)

const zoomPercent = computed(() => Math.round(zoom.value * 100))

function clampZoom(value) {
    return Math.min(10, Math.max(0.5, value))
}

function adjustZoom(amount) {
    zoom.value = clampZoom(zoom.value + amount)
}

function resetZoom() {
    zoom.value = 1
    imageOffset.value = { x: 0, y: 0 }
}

function close() {
    emit('close')
}

function handleWheel(event) {
    adjustZoom(event.deltaY < 0 ? 0.05 : -0.05)
}

function handleKeydown(event) {
    if (event.key === 'Escape') close()
    if (event.key === '+' || event.key === '=') adjustZoom(0.05)
    if (event.key === '-') adjustZoom(-0.05)
    if (event.key === '0') resetZoom()
}

function startPan(event) {
    dragStart.value = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offsetX: imageOffset.value.x,
        offsetY: imageOffset.value.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
}

function panImage(event) {
    if (!dragStart.value || dragStart.value.pointerId !== event.pointerId) return

    imageOffset.value = {
        x: dragStart.value.offsetX + event.clientX - dragStart.value.x,
        y: dragStart.value.offsetY + event.clientY - dragStart.value.y,
    }
}

function endPan(event) {
    if (dragStart.value?.pointerId !== event.pointerId) return
    dragStart.value = null
}

watch(
    () => [props.open, props.src],
    async ([open]) => {
        if (!open) return
        resetZoom()
        await nextTick()
        dialog.value?.focus()
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
            v-if="open && src"
            ref="dialog"
            class="fixed inset-0 z-[70] flex flex-col bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            tabindex="-1"
            @keydown="handleKeydown"
            @click.self="close">
            <div
                class="absolute left-1/2 top-7 z-10 flex w-max max-w-[calc(100%-3rem)] -translate-x-1/2 items-center gap-4 rounded-md border border-white/20 bg-black/50 px-5 py-4 text-white shadow-lg shadow-black/20 backdrop-blur-md sm:top-9">
                    <label class="sr-only" for="image-reviewer-zoom">Zoom</label>
                    <input
                        id="image-reviewer-zoom"
                        v-model.number="zoom"
                        class="w-20 accent-white"
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.05" />
                    <span class="w-10 text-right text-xs text-white/75">
                        {{ zoomPercent }}%
                    </span>
                    <button
                        type="button"
                        class="inline-flex h-9 items-center justify-center border border-white/30 px-3 text-xs text-white"
                        title="Reset zoom"
                        aria-label="Reset zoom and image position"
                        @click="resetZoom">
                        Reset
                    </button>
                    <button
                        type="button"
                        class="grid size-9 place-items-center border border-white/30 text-sm text-white"
                        title="Close image review"
                        aria-label="Close image review"
                        @click="close">
                        x
                    </button>
            </div>
            <div
                class="flex min-h-0 flex-1 items-center justify-center overflow-hidden touch-none"
                :class="dragStart ? 'cursor-grabbing' : 'cursor-grab'"
                @wheel.prevent="handleWheel"
                @pointerdown="startPan"
                @pointermove="panImage"
                @pointerup="endPan"
                @pointercancel="endPan">
                <img
                    :src="src"
                    :alt="alt"
                    class="pointer-events-none max-h-full max-w-full select-none object-contain"
                    draggable="false"
                    :style="{
                        transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoom})`,
                    }" />
            </div>
        </div>
    </transition>
</template>