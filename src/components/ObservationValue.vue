<template>
  <span v-if="isLiteral" :title="valueExpanded">
    {{ value?.value }}
  </span>
  <span v-else class="tag bg-gray-200 whitespace-nowrap">
    {{ value?.value }}
  </span>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import { CubeDimension } from 'rdf-cube-view-query'
import * as ns from '../namespace'

export default defineComponent({
  name: 'ObservationValue',
  props: {
    value: {
      type: Term,
      required: true,
    },
    dimension: {
      type: CubeDimension,
      required: true,
    },
  },

  computed: {
    isLiteral () {
      return this.value && this.value.termType === 'Literal'
    },

    valueExpanded () {
      const datatype = this.value.datatype ? `^^${ns.shrink(this.value.datatype.value)}` : ''
      const language = this.value.language ? `@${this.value.language}` : ''

      return `"${this.value.value}${language}"${datatype}`
    },
  },
})
</script>
