<template>
  <fieldset class="flex items-center gap-2">
    <select :value="filter.operation?.term.value" @change="updateOperation">
      <option v-for="operation in operations" :key="operation.term.value" :value="operation.term.value">
        {{ operation.label }}
      </option>
    </select>
    <select :value="filter.arg?.value" @change="updateArg">
      <option v-for="(option, index) in dimension.in" :key="index" :value="option.value">
        <term-display :term="option" />
      </option>
    </select>
  </fieldset>
</template>

<script>
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import TermDisplay from './TermDisplay.vue'
import * as ns from '../namespace'

const operations = [
  { term: ns.view.Eq, label: '=' },
  { term: ns.view.Ne, label: '!=' },
  { term: ns.view.In, label: 'in' },
  { term: ns.view.Lt, label: '<' },
  { term: ns.view.Lte, label: '<=' },
  { term: ns.view.Gt, label: '>' },
  { term: ns.view.Gte, label: '>=' },
]

export default defineComponent({
  name: 'DimensionFilters',
  components: { TermDisplay },
  props: {
    dimension: {
      type: CubeDimension,
      required: true,
    },
    filter: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:filter'],

  computed: {
    operations () {
      // TODO: Filter based on dimension
      return operations
    },
  },

  methods: {
    updateOperation (event) {
      const operation = operations.find(({ term }) => term.value === event.target.value)
      this.$emit('update:filter', { ...this.filter, operation })
    },

    updateArg (event) {
      const arg = this.dimension.in.find((term) => term.value === event.target.value)
      this.$emit('update:filter', { ...this.filter, arg })
    },
  },
})
</script>
