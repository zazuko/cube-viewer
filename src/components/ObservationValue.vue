<template>
  <span v-if="!value">-</span>
  <term-display v-else-if="value.termType === 'Literal'" :term="value" :base="cube.term.value" />
  <div v-else class="flex-grow flex items-center justify-end">
    <button @click="showResourceExplorer = true" class="tag bg-gray-200 whitespace-nowrap">
      <term-display :term="resourceLabel" :base="cube.term.value" />
    </button>
    <resource-explorer
      :uri="value"
      :cube="cube"
      :is-open="showResourceExplorer"
      @close="showResourceExplorer = false"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import { Cube } from 'rdf-cube-view-query'
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
    cube: {
      type: Cube,
      required: true,
    },
    labels: {
      type: Object,
      required: false,
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
        this.labels?.node(this.value).out(ns.schema.name, { language: this.language }).term ||
        this.cube.ptr.node(this.value).out(ns.schema.name, { language: this.language }).term ||
        this.value
      )
    },
  },
})
</script>
