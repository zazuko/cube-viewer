<template>
  <fieldset class="flex items-center gap-2">
    <SelectBox :modelValue="filter.operation" @update:modelValue="updateOperation" :options="operations">
      <template v-slot:button="{ selected }">
        <span v-if="selected" :term="selected.term">{{ selected.label }}</span>
        <span v-else class="text-gray-500">Operation</span>
      </template>
    </SelectBox>
    <SelectBox v-if="dimension.in && dimension.in.length > 0" :modelValue="filter.arg" @update:modelValue="updateArg" :options="dimension.in">
      <template v-slot:button="{ selected }">
        <term-display v-if="selected" :term="resourceLabel(selected)" :base="cube.term.value" />
        <span v-else class="text-gray-500">Value</span>
      </template>
      <template v-slot:option="{ option }">
        <term-display :term="resourceLabel(option)" :base="cube.term.value" />
      </template>
    </SelectBox>
    <div v-else>
      <term-input
        placeholder="Value"
        :modelValue="filter.arg"
        @update:modelValue="updateArg"
        :datatype="dimension.datatype"
      />
    </div>
  </fieldset>
</template>

<script>
import { defineComponent } from 'vue'
import { Cube, CubeDimension } from 'rdf-cube-view-query'
import SelectBox from './SelectBox.vue'
import TermDisplay from './TermDisplay.vue'
import TermInput from './TermInput.vue'
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
  components: { SelectBox, TermDisplay, TermInput },
  props: {
    cube: {
      type: Cube,
      required: true,
    },
    dimension: {
      type: CubeDimension,
      required: true,
    },
    filter: {
      type: Object,
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
  emits: ['update:filter'],

  computed: {
    operations () {
      // TODO: Filter based on dimension
      return operations
    },
  },

  methods: {
    updateOperation (operation) {
      this.$emit('update:filter', { ...this.filter, operation })
    },

    updateArg (arg) {
      this.$emit('update:filter', { ...this.filter, arg })
    },

    resourceLabel (term) {
      return (
        this.labels?.node(term).out(ns.schema.name, { language: this.language }).term ||
        this.cube.ptr.node(term).out(ns.schema.name, { language: this.language }).term ||
        term
      )
    },
  },
})
</script>
