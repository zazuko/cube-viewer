<script setup>
/* eslint-disable */
import { Term } from '@rdfjs/data-model'
import { defineProps, ref } from 'vue'
import useLangStore from '../stores/langStore.js'
import ResourceExplorer from './ResourceExplorer.vue'
import TermDisplay from './TermDisplay.vue'

const props = defineProps({
  value: {
    type: Term,
    required: true
  },
  forceLabel: {
    type: Term,
    required: false
  }
})

const showResourceExplorer = ref(false)
const langStore = useLangStore()

</script>

<template>
  <span v-if="!value">-</span>
  <term-display v-else-if="value.termType === 'Literal'" :term="value"/>
  <div v-else class="flex-grow flex items-center justify-end">
    <button @click="showResourceExplorer = true" class="tag bg-gray-200 whitespace-nowrap">
      <term-display v-if="forceLabel" :term="forceLabel"/>
      <term-display v-else :term="value"/>
    </button>
    <resource-explorer
      :uri="value"
      :pointer="langStore.pointer"
      :is-open="showResourceExplorer"
      @close="showResourceExplorer = false"
    />
  </div>
</template>
