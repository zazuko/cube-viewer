<template>
  <p>
    <span v-if="label">{{ label }}</span>
    <span v-else class="text-gray-500">Untitled</span>
  </p>
</template>

<script>
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import { sh } from '../namespace'

export default defineComponent({
  name: 'DimensionHeader',
  props: {
    dimension: {
      type: CubeDimension,
      required: true,
    },
    language: {
      type: Array,
      required: true,
    },
  },

  computed: {
    label () {
      return this.dimension.out(sh.name, { language: this.language }).value
    },
  },
})
</script>
