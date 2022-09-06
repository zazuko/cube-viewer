<script setup>
/* eslint-disable */
import { Term } from '@rdfjs/data-model'
import { defineProps } from 'vue'
import useLangStore from '../stores/langStore.js'

const props = defineProps({
  term: {
    type: Term,
    required: true
  },
  showLanguage: {
    type: Boolean,
    default: false
  }
})

const {
  getDisplayTerm,
  getDisplayString
} = useLangStore()


</script>

<template>
  <span :title="getDisplayString(term)">
    {{ getDisplayTerm(term).value }}
    <span v-if="showLanguage && term.language" class="text-gray-400">@{{ term.language }}</span>
  </span>
</template>
