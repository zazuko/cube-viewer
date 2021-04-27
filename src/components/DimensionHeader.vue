<template>
  <th :class="{'bg-primary-100': isMeasure}">
    <p class="mb-2 flex items-center justify-between">
      <button
        class="flex items-center"
        :class="{'font-semibold': (isMeasure || isKey), 'underline': isSortDimension}"
        :title="property"
        @click="updateSort"
      >
        <span v-if="label">{{ label }}</span>
        <span v-else class="text-gray-500">Untitled</span>
        <span v-if="isSortDimension" class="pt-1">
          <chevron-down-icon v-if="isSortAscending" />
          <chevron-up-icon v-if="isSortDescending" />
        </span>
      </button>
      <popover class="relative">
        <popover-button as="button">
          <filter-icon :class="{ 'text-primary-500': filters.length > 0 }" />
        </popover-button>
        <popover-panel class="z-10 absolute bg-white border rounded shadow-md p-2">
          <dimension-filters
            :dimension="dimension"
            :filters="filters"
            @update:filters="$emit('update:filters', dimension, $event)"
          />
        </popover-panel>
      </popover>
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
import { Term } from '@rdfjs/data-model'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import ChevronDownIcon from './icons/ChevronDownIcon.vue'
import ChevronUpIcon from './icons/ChevronUpIcon.vue'
import CommentIcon from './icons/CommentIcon.vue'
import DataKindIcon from './DataKindIcon.vue'
import DimensionFilters from './DimensionFilters.vue'
import FilterIcon from './icons/FilterIcon.vue'
import LinkIcon from './icons/LinkIcon.vue'
import ScaleTypeIcon from './ScaleTypeIcon.vue'
import * as ns from '../namespace'

export default defineComponent({
  name: 'DimensionHeader',
  components: {
    ChevronDownIcon,
    ChevronUpIcon,
    CommentIcon,
    DataKindIcon,
    DimensionFilters,
    FilterIcon,
    LinkIcon,
    Popover,
    PopoverButton,
    PopoverPanel,
    ScaleTypeIcon,
  },
  props: {
    dimension: {
      type: CubeDimension,
      required: true,
    },
    language: {
      type: [Array, String],
      required: true,
    },
    sortDimension: {
      type: CubeDimension,
      default: null,
    },
    sortDirection: {
      type: Term,
      required: true,
    },
    filters: {
      type: Array,
      required: true,
    },
  },
  emits: ['updateSort', 'update:filters'],

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

    isSortDimension () {
      return this.sortDimension && this.dimension.path.equals(this.sortDimension.path)
    },

    isSortAscending () {
      return ns.view.Ascending.equals(this.sortDirection)
    },

    isSortDescending () {
      return ns.view.Descending.equals(this.sortDirection)
    },
  },

  methods: {
    updateSort () {
      const direction = this.isSortDimension ? toggleDirection(this.sortDirection) : ns.view.Ascending
      this.$emit('updateSort', this.dimension, direction)
    },
  },
})

function toggleDirection (direction) {
  if (ns.view.Ascending.equals(direction)) {
    return ns.view.Descending
  } else {
    return ns.view.Ascending
  }
}
</script>
