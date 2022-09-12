/* eslint-disable */
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

const useViewStore = defineStore('viewStore', () => {
  // State
  const currentView = shallowRef()

  // Getter
  function filtersOfDimension (viewDimension) {
    return currentView.value.filters.filter(x => x.dimension.equals(viewDimension.ptr.term))
  }

  function removeFilter({filter}){
    currentView.value.clearFilter(filter)
  }

  function updateDimensionFilters(viewDimension, newFilters){
    for (const filter of filtersOfDimension(viewDimension)){
      currentView.value.clearFilter(filter)
    }
    for (const filter of newFilters){
      currentView.value.addFilter(filter)
    }
  }

  return {
    currentView,
    filtersOfDimension,
    updateDimensionFilters,
    removeFilter
  }
})

export default useViewStore
