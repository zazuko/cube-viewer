<template>
  <th :class="{
      'bg-primary-100': isMeasure,
      'font-semibold': (isMeasure || isKey),
      'font-normal': !(isMeasure || isKey),
    }"
  >
    <span v-if="label">{{ label }}</span>
    <span v-else class="text-gray-500">Untitled</span>
  </th>
</template>

<script>
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import * as ns from '../namespace'

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
      return this.dimension.out(ns.schema.name, { language: this.language }).value
    },

    isMeasure () {
      return !!this.dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term
    },

    isKey () {
      return !!this.dimension.ptr.has(ns.rdf.type, ns.cube.KeyDimension).term
    },
  },
})
</script>
