<template>
  <span v-if="!value">-</span>
  <term-display v-else-if="value.termType === 'Literal'" :term="value" :base="cube.term.value" />
  <popover v-else class="relative">
    <popover-button class="tag bg-gray-200 whitespace-nowrap">
      <term-display :term="value" :base="cube.term.value" />
    </popover-button>
    <popover-panel class="absolute z-10 bg-white border border-gray-300 rounded shadow-lg p-4">
      <resource-details :uri="value" :cube="cube" />
    </popover-panel>
  </popover>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import { Cube } from 'rdf-cube-view-query'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import ResourceDetails from './ResourceDetails.vue'
import TermDisplay from './TermDisplay.vue'

export default defineComponent({
  name: 'ObservationValue',
  components: { Popover, PopoverButton, PopoverPanel, ResourceDetails, TermDisplay },
  props: {
    value: {
      type: Term,
      required: true,
    },
    cube: {
      type: Cube,
      required: true,
    },
  },

  computed: {
    isLiteral () {
      return this.value && this.value.termType === 'Literal'
    },
  },
})
</script>
