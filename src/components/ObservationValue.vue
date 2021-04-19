<template>
  <span>
    {{ value?.value }}
  </span>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import { CubeDimension } from 'rdf-cube-view-query'

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
})
</script>
