/* eslint-disable */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useFilterStore = defineStore('filterStore', () => {
  // State
  const filters = ref([])

  // Actions
  function filtersOfDimension (dimension) {
    return filters.value.filter(x => x.dimension.ptr.term.equals(dimension.ptr.term))
  }

  function updateDimensionFilters (dimension, newFilters) {
    const notInDimension = filters.value.filter(x => !x.dimension.ptr.term.equals(dimension.ptr.term))
    filters.value = [...notInDimension, ...newFilters]
  }

  return {
    filters,
    filtersOfDimension,
    updateDimensionFilters
  }
})

export default useFilterStore
