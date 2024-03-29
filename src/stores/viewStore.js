/* eslint-disable */
import { defineStore } from 'pinia'
import { Filter } from 'rdf-cube-view-query'
import { shallowRef } from 'vue'

const useViewStore = defineStore('viewStore', () => {
  // State
  const currentView = shallowRef()

  // Getter
  function filtersOfDimension (viewDimension) {
    return currentView.value.filters.filter(x => x.dimension.equals(viewDimension.ptr.term))
  }

  function removeFilter ({ filter }) {
    currentView.value.clearFilter(filter)
  }

  function updateDimensionFilters (viewDimension, newFilters) {

    for (const filter of filtersOfDimension(viewDimension)) {
      if (!filter.argList) { // Keep it like it was
        currentView.value.clearFilter(filter)
      }
    }
    for (const filter of newFilters) {
      const newFilter = new Filter({
        dimension: viewDimension,
        operation: filter.operation,
        arg: filter.args,
        parent: currentView.value
      })

      currentView.value.addFilter(newFilter)
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
