<template>
  <th :class="{
      'bg-primary-100': isMeasure,
      'font-semibold': (isMeasure || isKey),
      'font-normal': !(isMeasure || isKey),
    }"
  >
    <p class="mb-1" :title="property">
      <span v-if="label">{{ label }}</span>
      <span v-else class="text-gray-500">Untitled</span>
    </p>
    <p class="flex items-center gap-1">
      <scale-type-icon :scale-of-measure="scaleType" />
      <data-kind-icon :data-kind="dataKind" />
      <span v-if="description" class="tag" :title="description">
        <comment-icon />
      </span>
      <span v-if="isShared" class="tag" title="Linked to shared dimension">
        <link-icon />
      </span>
    </p>
  </th>
</template>

<script>
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import CommentIcon from './icons/CommentIcon.vue'
import DataKindIcon from './DataKindIcon.vue'
import LinkIcon from './icons/LinkIcon.vue'
import ScaleTypeIcon from './ScaleTypeIcon.vue'
import * as ns from '../namespace'

export default defineComponent({
  name: 'DimensionHeader',
  components: { CommentIcon, DataKindIcon, LinkIcon, ScaleTypeIcon },
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

    description () {
      return this.dimension.out(ns.schema.comment, { language: this.language }).value
    },

    property () {
      return this.dimension.out(ns.sh.path).value
    },

    isMeasure () {
      return !!this.dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term
    },

    isKey () {
      return !!this.dimension.ptr.has(ns.rdf.type, ns.cube.KeyDimension).term
    },

    isShared () {
      return !!this.dimension.ptr.has(ns.rdf.type, ns.cube.SharedDimension).term
    },

    dataKind () {
      return this.dimension.out(ns.meta.dataKind)
    },

    scaleType () {
      return this.dimension.out(ns.qudt.scaleType)
    },
  },
})
</script>
