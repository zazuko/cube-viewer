<script setup>
/* eslint-disable */
import { PlusIcon } from '@heroicons/vue/solid'
import { defineProps, onMounted, ref } from 'vue'
import useLangStore from '../stores/langStore.js'
import useViewStore from '../stores/viewStore.js'
import DimensionFilter from './DimensionFilter.vue'

const emit = defineEmits(['close', 'updateFilters'])

const props = defineProps({
  dimension: {
    type: Object,
    required: true
  },
  viewDimension: {
    type: Object,
    required: true
  }
})

const viewStore = useViewStore()
const {
  filtersOfDimension,
  updateDimensionFilters,
} = viewStore
const langStore = useLangStore()

const filters = ref([])

onMounted(() => {
  // Could be functional, but like this is clearer
  const data = []
  for (const filter of filtersOfDimension(props.viewDimension)) {
    const {
      dimension,
      operation,
      args,
      argsList
    } = filter

    if (argsList) {
      console.log('pushing argsList') // This corresponds to a list of arguments (never seen a case)
      data.push({
        filter:{dimension,operation,argsList},
        readOnly: langStore.getFilterLabel({ operation, args, argsList })
      })
    } else {
      console.log('pushing args') // This corresponds to a set of arguments
      data.push({
        filter:{dimension,operation,args},
      })
    }
  }
  filters.value = data
})

function submit () {

  for (const current of filters.value){
    console.log('filter',current)
  }


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

function updateFilter({ index, filter }){
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
        @updateFilter="(filter)=>updateFilter({index, filter})"
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
