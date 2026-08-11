<script setup>
defineProps({
  services: { type: Array, required: true },
  valuationService: { type: Object, required: true },
});
defineEmits(["select-service"]);

const faqs = [
  {
    question: "Do I need to ship my item?",
    answer: "No. All authentication is conducted remotely from photographs.",
  },
  {
    question: "What if my item is deemed inauthentic?",
    answer: "You will receive detailed findings. The same fee applies.",
  },
  {
    question: "Are certificates transferable?",
    answer: "Yes. Certificates are issued to the item, not the person.",
  },
  {
    question: "What brands do you authenticate?",
    answer: "We currently specialize in the eight brands listed above.",
  },
  {
    question: "How many photos do I need?",
    answer: "A minimum of 6 photographs covering key item views.",
  },
  {
    question: "Is this an official brand service?",
    answer: "No. The Verified Bag is an independent authentication service.",
  },
];
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-5xl">
      <div class="mb-16 text-center">
        <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">
          Transparent Pricing
        </p>
        <h1 class="mb-4 font-display text-4xl font-semibold">
          Authentication
        </h1>
        <p
          class="mx-auto max-w-lg font-sans-dm text-sm text-(--muted-foreground)"
        >
          Start with a market range, then choose a formal authentication service
          when you need a verifiable certificate.
        </p>
      </div>
      <div
        class="mb-6 flex flex-col justify-between gap-4 border border-(--border) bg-(--card) p-6 sm:flex-row sm:items-center"
      >
        <div>
          <p class="small-caps mb-1 font-sans-dm text-xs text-(--primary)">
            Quick Opinion
          </p>
          <p class="font-display text-3xl font-semibold">EUR 0.99</p>
          <p class="mt-1 font-sans-dm text-sm text-(--muted-foreground)">
            A fast informal expert verdict. No certificate is issued.
          </p>
        </div>
        <app-button
          variant="goldOutline"
          class="shrink-0 px-7 py-3"
          @click="$emit('select-service')"
          >Get Quick Opinion</app-button
        >
      </div>
      <div class="mb-16 grid border border-(--border) md:grid-cols-3">
        <article
          v-for="service in services.slice(1)"
          :key="service.id"
          class="relative border-b border-(--border) p-10 last:border-0 md:border-b-0 md:border-r md:last:border-0"
          :class="
            service.id === 'digital-era'
              ? 'bg-(--primary) text-(--primary-foreground)'
              : 'bg-(--card)'
          "
        >
          <span
            v-if="service.id === 'digital-era'"
            class="absolute right-4 top-4 bg-(--card) px-2.5 py-1 font-sans-dm text-[10px] tracking-widest text-(--primary)"
            >MOST POPULAR</span
          >
          <p
            class="small-caps mb-3 font-sans-dm text-xs"
            :class="
              service.id === 'digital-era'
                ? 'text-[rgba(250,247,241,.65)]'
                : 'text-(--primary)'
            "
          >
            {{ service.label }}
          </p>
          <p class="mb-1 font-display text-5xl font-semibold">
            {{ service.price }}
          </p>
          <p
            class="mb-8 font-sans-dm text-xs"
            :class="
              service.id === 'digital-era'
                ? 'text-[rgba(250,247,241,.65)]'
                : 'text-(--muted-foreground)'
            "
          >
            per item, {{ service.time }}
          </p>
          <p
            v-if="service.description"
            class="-mt-4 mb-8 font-sans-dm text-xs italic leading-5"
            :class="service.id === 'digital-era' ? 'text-[rgba(250,247,241,.85)]' : 'text-(--muted-foreground)'"
          >
            {{ service.description }}
          </p>
          <ul class="mb-10 space-y-3">
            <li
              v-for="feature in service.features"
              :key="feature"
              class="flex gap-3 font-sans-dm text-sm"
              :class="
                service.id === 'digital-era'
                  ? 'text-[rgba(250,247,241,.85)]'
                  : 'text-(--muted-foreground)'
              "
            >
              <i
                class="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-(--primary)"
                :class="service.id === 'digital-era' ? 'bg-(--card)' : ''"
              />{{ feature }}
            </li>
          </ul>
          <app-button
            :variant="
              service.id === 'digital-era' ? 'outline' : 'goldOutline'
            "
            class="w-full py-3"
            :class="
              service.id === 'digital-era'
                ? 'border-[rgba(250,247,241,.6)] text-(--primary-foreground)'
                : ''
            "
            @click="$emit('select-service', service)"
            >Select {{ service.label }}</app-button
          >
        </article>
      </div>
      <article
        class="mb-16 flex flex-col justify-between gap-6 border border-(--border) bg-(--secondary) p-6 sm:flex-row sm:items-end"
      >
        <div>
          <p class="small-caps mb-2 font-sans-dm text-xs text-(--primary)">
            {{ valuationService.label }}
          </p>
          <p class="font-display text-3xl font-semibold">
            {{ valuationService.price }}
          </p>
          <p class="mt-2 max-w-xl font-sans-dm text-sm leading-6 text-(--muted-foreground)">
            Upload photographs and item details for an {{ valuationService.time.toLowerCase() }}.
          </p>
          <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <li
              v-for="feature in valuationService.features"
              :key="feature"
              class="flex items-center gap-2 font-sans-dm text-xs text-(--muted-foreground)"
            >
              <span class="h-1 w-1 bg-(--primary)" />{{ feature }}
            </li>
          </ul>
        </div>
        <router-link
          to="/valuate"
          class="shrink-0 border border-(--primary) px-7 py-3 text-center font-sans-dm text-sm text-(--primary)"
          >Valuate an item</router-link
        >
      </article>
      <app-divider label="Common Questions" class="my-8" />
      <div class="mt-8 grid gap-8 md:grid-cols-2">
        <article
          v-for="faq in faqs"
          :key="faq.question"
          class="border-t border-(--border) py-6"
        >
          <h3 class="mb-2 font-display text-sm font-semibold">
            {{ faq.question }}
          </h3>
          <p
            class="font-sans-dm text-sm leading-relaxed text-(--muted-foreground)"
          >
            {{ faq.answer }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
