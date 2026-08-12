<script setup>
import { computed } from "vue";

const props = defineProps({
  submissions: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

defineEmits(["new-submission", "view-submission"]);

const stats = computed(() => [
  { label: "Total Submissions", value: props.submissions.length },
  {
    label: "Draft",
    value: props.submissions.filter(
      (submission) => submission.rawStatus === "draft",
    ).length,
  },
  {
    label: "Reviewing",
    value: props.submissions.filter(
      (submission) => submission.rawStatus === "reviewing",
    ).length,
  },
  {
    label: "Valuations Queued",
    value: props.submissions.filter((submission) => submission.rawStatus === "queued").length,
  },
  {
    label: "Completed",
    value: props.submissions.filter(
      (submission) => submission.rawStatus === "completed",
    ).length,
  },
]);

const headings = ["Reference", "Item", "Case Type", "Status", "Date"];

function caseTypeClass(caseType) {
  return caseType?.toLowerCase() === "express"
    ? "bg-[#dbeafe] text-[#1d4f91]"
    : "bg-(--secondary) text-(--primary)";
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-5xl">
      <div
        class="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <p class="small-caps mb-1 font-sans-dm text-xs text-(--primary)">
            Client Portal
          </p>
          <h1 class="font-display text-3xl font-semibold">Your Submissions</h1>
        </div>
        <app-button class="px-6 py-2.5" @click="$emit('new-submission')"
          >+ New Submission</app-button
        >
      </div>
      <div class="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <article
          v-for="stat in stats"
          :key="stat.label"
          class="border border-(--border) bg-(--card) p-6"
        >
          <p class="mb-1 font-display text-3xl font-semibold text-(--primary)">
            {{ stat.value }}
          </p>
          <p class="font-sans-dm text-xs text-(--muted-foreground)">
            {{ stat.label }}
          </p>
        </article>
      </div>
      <div class="overflow-x-auto border border-(--border) bg-(--card)">
        <h2
          class="border-b border-(--border) px-6 py-4 font-display text-base font-semibold"
        >
          Saved Submissions
        </h2>
        <p
          v-if="loading"
          class="px-6 py-8 font-sans-dm text-sm text-(--muted-foreground)"
        >
          Loading submissions...
        </p>
        <p
          v-else-if="error"
          role="alert"
          class="px-6 py-8 font-sans-dm text-sm text-red-700"
        >
          {{ error }}
        </p>
        <p
          v-else-if="!submissions.length"
          class="px-6 py-8 font-sans-dm text-sm text-(--muted-foreground)"
        >
          No submissions created in this browser yet.
        </p>
        <table v-else class="w-full min-w-170">
          <thead>
            <tr class="border-b border-(--border)">
              <th
                v-for="heading in headings"
                :key="heading"
                class="px-6 py-3 text-left font-sans-dm text-xs font-normal tracking-widest text-(--muted-foreground)"
              >
                {{ heading }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="submission in submissions"
              :key="submission.id"
              class="cursor-pointer border-b border-(--border) hover:bg-(--secondary) last:border-0"
              tabindex="0"
              @click="$emit('view-submission', submission)"
              @keydown.enter="$emit('view-submission', submission)"
            >
              <td
                class="px-6 py-4 font-sans-dm text-xs text-(--muted-foreground)"
              >
                {{ submission.reference }}
              </td>
              <td class="px-6 py-4">
                <p class="font-sans-dm text-sm">{{ submission.item }}</p>
                <p class="font-sans-dm text-xs text-(--muted-foreground)">
                  {{ submission.brand }}
                </p>
              </td>
              <td class="px-6 py-4">
                <span class="small-caps inline-block px-3 py-1 font-sans-dm text-xs" :class="caseTypeClass(submission.caseType)">
                  {{ submission.caseType }}
                </span>
              </td>
              <td class="px-6 py-4">
                <submission-status :status="submission.status" />
              </td>
              <td
                class="px-6 py-4 font-sans-dm text-sm text-(--muted-foreground)"
              >
                {{ submission.date }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
