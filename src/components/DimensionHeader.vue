<script setup>
/* eslint-disable */
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { AnnotationIcon, FilterIcon } from '@heroicons/vue/outline'
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/vue/solid'
import { Term } from '@rdfjs/data-model'
import { CubeDimension } from 'rdf-cube-view-query'
import { computed, defineEmits, defineProps } from 'vue'
import * as ns from '../namespace'
import useFilterStore from '../stores/filterStore.js'
import useLangStore from '../stores/langStore.js'
import DataKindIcon from './DataKindIcon.vue'
import DimensionFilters from './DimensionFilters.vue'
import DimensionMetadata from './DimensionMetadata.vue'
import ScaleTypeIcon from './ScaleTypeIcon.vue'

const emit = defineEmits(['updateSort','updateFilters'])

const props = defineProps({
  dimension: {
    type: CubeDimension,
    required: true
  },
  sortDimension: {
    type: CubeDimension,
    default: null
  },
  sortDirection: {
    type: Term,
    required: true
  }
})

const langStore = useLangStore()

const {
  filtersOfDimension
} = useFilterStore()

const label = computed(() => props.dimension.ptr.out(ns.schema.name, { language: langStore.language }).value)
const description = computed(() => props.dimension.ptr.out(ns.schema.comment, { language: langStore.language }).value)
const property = computed(() => props.dimension.ptr.out(ns.sh.path).value)
const isMeasure = computed(() => !!props.dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term)
const isKey = computed(() => !!props.dimension.ptr.has(ns.rdf.type, ns.cube.KeyDimension).term)
const isShared = computed(() => !!props.dimension.ptr.has(ns.rdf.type, ns.cube.SharedDimension).term)
const dataKind = computed(() => props.dimension.ptr.out(ns.meta.dataKind))
const scaleType = computed(() => props.dimension.ptr.out(ns.qudt.scaleType))
const isSortDimension = computed(() => props.sortDimension && props.dimension.path.equals(props.sortDimension.path))
const isSortAscending = computed(() => ns.view.Ascending.equals(props.sortDirection))
const isSortDescending = computed(() => ns.view.Descending.equals(props.sortDirection))

function updateSort () {
  const direction = isSortDimension ? toggleDirection(props.sortDirection) : ns.view.Ascending
  emit('updateSort', props.dimension, direction)
}

function toggleDirection (direction) {
  if (ns.view.Ascending.equals(direction)) {
    return ns.view.Descending
  } else {
    return ns.view.Ascending
  }
}

</script>

<template>
  <div class="h-full px-2 py-1 flex flex-col justify-between" :class="{'bg-primary-50': isMeasure}">
    <div class="mb-2 flex items-center justify-between">
      <button
        class="flex items-start text-left leading-tight"
        :class="{'font-semibold': (isMeasure || isKey), 'underline': isSortDimension}"
        :title="property"
        @click="updateSort"
      >
        <span v-if="label">{{ label }}</span>
        <span v-else class="text-gray-500">Untitled</span>
        <span v-if="isSortDimension" class="pt-1">
          <chevron-down-icon v-if="isSortAscending" class="w-5 h-5" />
          <chevron-up-icon v-if="isSortDescending" class="w-5 h-5" />
        </span>
      </button>
      <popover class="relative">
        <popover-button as="button">
          <filter-icon class="w-5 h-5" :class="{ 'text-primary-500': filtersOfDimension(dimension).length > 0 }"/>
        </popover-button>
        <popover-panel v-slot="{ close }" class="z-10 absolute bg-white border rounded shadow-md p-2">
          <dimension-filters
            :dimension="dimension"
            @close="()=>close"
            @updateFilters="emit('updateFilters')"
          />
        </popover-panel>
      </popover>
    </div>
    <div class="flex items-center gap-1">
      <scale-type-icon :scale-of-measure="scaleType" />
      <data-kind-icon :data-kind="dataKind" />
      <span v-if="description" class="tag" :title="description">
        <annotation-icon class="w-5 h-5" />
      </span>
      <span v-if="isShared" class="tag" title="Linked to shared dimension">
        <link-icon class="w-5 h-5" />
      </span>
      <dimension-metadata :dimension="dimension" />
    </div>
  </div>
</template>
