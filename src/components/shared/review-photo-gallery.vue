<script setup>
defineProps({
    photos: { type: Array, default: () => [] },
    error: { type: String, default: '' },
    title: { type: String, default: 'Submitted photographs' },
    emptyMessage: {
        type: String,
        default: 'No photographs are available for this request.',
    },
})

const selectedPhoto = ref(null)
</script>

<template>
    <section aria-labelledby="review-photos-heading">
        <div class="mb-4 flex items-center justify-between">
            <h3
                id="review-photos-heading"
                class="font-display text-xl font-semibold">
                {{ title }}
            </h3>
            <span class="text-sm text-(--muted-foreground)">
                {{ photos.length }}
            </span>
        </div>
        <p
            v-if="error"
            role="alert"
            class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {{ error }}
        </p>
        <p
            v-else-if="!photos.length"
            class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
            {{ emptyMessage }}
        </p>
        <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <button
                v-for="photo in photos"
                :key="photo.id"
                type="button"
                class="group relative aspect-square overflow-hidden border border-(--border) bg-(--secondary) text-left"
                :aria-label="`Open ${photo.label}`"
                @click="selectedPhoto = photo">
                <img
                    :src="photo.url"
                    :alt="photo.label"
                    class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                <span
                    class="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,0.6)] px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {{ photo.label }}
                </span>
            </button>
        </div>
    </section>

    <image-reviewer
        :open="Boolean(selectedPhoto)"
        :src="selectedPhoto?.url || ''"
        :alt="selectedPhoto?.label || 'Submitted photograph'"
        @close="selectedPhoto = null" />
</template>