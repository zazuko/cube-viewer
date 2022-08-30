<script setup>
/* eslint-disable */
import { computed, defineProps, inject, ref } from 'vue'
import * as ns from '../namespace.js'
import { InformationCircleIcon } from '@heroicons/vue/outline'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'

const props = defineProps({
  pointer: {
    type: Object,
    required: true
  }
})

const language = inject('language')
const isMetadataOpen = ref(false)

const description = computed(() => {
  if (!props.pointer) {
    return null
  }
  const description = props.pointer.out(ns.schema.description, { language: language.value }).value
  return description ?? null
})

const title = computed(() => {
  if (!props.pointer) {
    return null
  }
  const title = props.pointer.out(ns.schema.name, { language: language.value }).value
  return title ?? null
})

</script>

<template>
  <div class="flex flex-row">
    <h1 class="font-bold mb-2 grow" :title="pointer.term.value">
      <span v-if="title">{{ title }}</span>
      <span v-else class="text-gray-500">Untitled</span>
    </h1>
  </div>
  <section v-if="description" class="text-sm text-gray-700">
    {{ description }}
  </section>
  <div>
    <button @click="isMetadataOpen = true" title="Metadata">
      <information-circle-icon class="text-gray-500 w-5 h-5"/>
    </button>
    <resource-details-dialog
      title="Metadata"
      :pointer="pointer"
      :is-open="isMetadataOpen"
      @close="isMetadataOpen = false"
    />
  </div>
</template>
