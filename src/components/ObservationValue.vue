<template>
  <span v-if="!value">-</span>
  <term-display v-else-if="value.termType === 'Literal'" :term="value" :base="pointer.term.value" />
  <div v-else class="flex-grow flex items-center justify-end">
    <button @click="showResourceExplorer = true" class="tag bg-gray-200 whitespace-nowrap">
      <term-display :term="resourceLabel" :base="pointer.term.value" />
    </button>
    <resource-explorer
      :uri="value"
      :pointer="pointer"
      :is-open="showResourceExplorer"
      @close="showResourceExplorer = false"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import ResourceExplorer from './ResourceExplorer.vue'
import TermDisplay from './TermDisplay.vue'
import * as ns from '../namespace'

export default defineComponent({
  name: 'ObservationValue',
  components: { ResourceExplorer, TermDisplay },
  props: {
    value: {
      type: Term,
      required: true,
    },
    pointer: {
      type: Object,
      required: true,
    },
    language: {
      type: [String, Array],
      required: false,
    },
  },

  data () {
    return {
      showResourceExplorer: false,
    }
  },

  computed: {
    isLiteral () {
      return this.value && this.value.termType === 'Literal'
    },

    resourceLabel () {
      return (
        this.pointer.node(this.value).out(ns.schema.name, { language: this.language }).term ||
        this.pointer.node(this.value).out(ns.rdfs.label, { language: this.language }).term ||
        this.value
      )
    },
  },
})
</script>
