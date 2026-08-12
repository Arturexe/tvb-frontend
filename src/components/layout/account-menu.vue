<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
    user: { type: Object, required: true },
})

const emit = defineEmits(['logout'])
const menu = ref(null)
const isOpen = ref(false)
const accountInitials = computed(
    () =>
        props.user.name
            ?.split(/\s+/)
            .filter(Boolean)
            .map((namePart) => namePart[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U'
)
const menuItemClass =
    'block w-full appearance-none border-0 bg-transparent px-4 py-3 text-left font-sans-dm text-sm leading-5 text-(--foreground) hover:bg-(--secondary)'

function closeMenu() {
    isOpen.value = false
}

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function handleDocumentClick(event) {
    if (!menu.value?.contains(event.target)) {
        closeMenu()
    }
}

function handleKeydown(event) {
    if (event.key === 'Escape') {
        closeMenu()
    }
}

function logout() {
    closeMenu()
    emit('logout')
}

onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
    <div
        ref="menu"
        class="relative"
        @mouseenter="isOpen = true"
        @mouseleave="closeMenu">
        <button
            class="font-sans-dm flex items-center gap-2 p-1 text-sm text-(--muted-foreground) hover:text-(--primary)"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            :aria-label="`Account menu for ${user.name}`"
            @click="toggleMenu">
            <span
                class="font-sans-dm flex h-7 w-7 items-center justify-center rounded-full bg-(--primary) text-[10px] text-(--primary-foreground)">
                {{ accountInitials }}
            </span>
            <span class="max-w-24 truncate">{{ user.name }}</span>
            <span aria-hidden="true" class="text-xs">⌄</span>
        </button>
        <div v-if="isOpen" class="absolute top-full right-0 z-10 w-40 pt-2">
            <div
                class="overflow-hidden border border-(--border) bg-(--card) shadow-sm"
                role="menu">
                <router-link
                    to="/dashboard"
                    :class="menuItemClass"
                    role="menuitem"
                    @click="closeMenu">
                    Dashboard
                </router-link>
                <a
                    href="#"
                    :class="menuItemClass"
                    role="menuitem"
                    @click.prevent="logout">
                    Sign out
                </a>
            </div>
        </div>
    </div>
</template>
