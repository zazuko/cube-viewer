<script setup>
/* eslint-disable */
import { PlusIcon } from '@heroicons/vue/solid'
import { CubeDimension } from 'rdf-cube-view-query/index.js'
import { defineProps, onMounted, ref } from 'vue'
import useFilterStore from '../stores/filterStore.js'
import DimensionFilter from './DimensionFilter.vue'

const emit = defineEmits(['close', 'updateFilters'])

const props = defineProps({
  dimension: {
    type: CubeDimension,
    required: true
  }
})

const filterStore = useFilterStore()
const filtersData = ref([])

onMounted(() => {
  // Filters are nested in `[].value` because Vue doesn't like it when we
  // use items of a v-for loop as v-model
  filtersData.value = filterStore.filtersOfDimension(props.dimension).map(filter => ({ value: filter }))
})

function submit () {
  const dimensionFilters = filtersData.value
    .map(({ value }) => value)
    .filter(({
      operation,
      arg
    }) => operation && arg)

  filterStore.updateDimensionFilters(props.dimension, dimensionFilters)
  emit('close')
  emit('updateFilters')
}

function addFilter () {
  filtersData.value.push({
    value: {
      dimension: props.dimension,
      operation: null,
      args: null
    }
  })
}

</script>

<template>
  <form @submit.prevent="submit" class="">
    <div class="mb-4 flex flex-col gap-2">
      <dimension-filter
        v-for="(filter, index) in filtersData"
        :key="index"
        :dimension="dimension"
        v-model:filter="filter.value"
      />
      <button type="button" @click="addFilter" class="button-text justify-end">
        <plus-icon class="w-5 h-5" />
        Add filter
      </button>
    </div>
    <button type="submit" class="button-primary self-end">
      Apply filters
    </button>
  </form>
</template>
