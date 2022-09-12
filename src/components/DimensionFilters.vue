<script setup>
/* eslint-disable */
import { PlusIcon } from '@heroicons/vue/solid'
import { CubeDimension, Filter, ViewDimension } from 'rdf-cube-view-query/index.js'
import { defineProps, onMounted, ref } from 'vue'
import useViewStore from '../stores/viewStore.js'
import DimensionFilter from './DimensionFilter.vue'

const emit = defineEmits(['close', 'updateFilters'])

const props = defineProps({
  dimension: {
    type: CubeDimension,
    required: true
  },
  viewDimension: {
    type: ViewDimension,
    required: true
  }
})


const viewStore = useViewStore()
const {
  filtersOfDimension,
  updateDimensionFilters,
} = viewStore

const filters = ref([])

onMounted(() => {
  // Could be functional, but like this is clearer
  const data = []
  for (const filter of filtersOfDimension(props.viewDimension)) {
    const {
      dimension,
      operation,
      arg,
      args,
      argsList
    } = filter

    if (argsList) {
      console.log('pushing argsList')
      data.push({
        filter:{dimension,operation,argsList},
        exception: 'Cannot edit at the moment'
      })
    } else if (arg) {
      console.log('pushing arg')
      data.push({
        filter:{dimension,operation,arg},
      })
    } else if (args) {
      console.log('pushing args')
      for (const arg of args) {
        data.push({filter:{dimension,operation,arg}})
      }
    }
  }
  filters.value = data
})

function submit () {
  const dimensionFilters = filters.value.filter(x => !x.filterPlaceholder).map(x => x.filter)
  try {
    updateDimensionFilters(props.viewDimension, dimensionFilters)
    emit('updateFilters')
  } catch (error) {
    console.log(error)
  }
  emit('close')

}

function addFilter () {
  filters.value.push({
    filterPlaceholder: true
  })
}

function updateFilter({ index,filter }){
  filters.value[index]= { filter }
}

</script>

<template>
  <form @submit.prevent="submit" class="">
    <div class="mb-4 flex flex-col gap-2">
      <dimension-filter
        v-for="(current, index) in filters"
        :key="index"
        :dimension="dimension"
        :viewDimension="viewDimension"
        :filterWrapper="current"
        @updateFilter="updateFilter"
        :index="index"
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
