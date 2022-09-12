<script setup>
/* eslint-disable */
import { Term } from '@rdfjs/data-model'
import { computed, defineProps } from 'vue'
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

const title = computed(() => {
  return getDisplayString ? getDisplayString(props.term) : props.term
})
const displayValue = computed(() => {
  return getDisplayTerm ? getDisplayTerm(props.term).value : props.term.value
})


</script>

<template>
  <span :title="title">
    {{ displayValue }}
    <span v-if="showLanguage && term.language" class="text-gray-400">@{{ term.language }}</span>
  </span>
</template>
