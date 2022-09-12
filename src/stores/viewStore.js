/* eslint-disable */
import { defineStore } from 'pinia'
import { Filter } from 'rdf-cube-view-query'
import rdf from 'rdf-ext'
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

    for (const filter of newFilters) {
      if (!filter.dimension) {
        throw Error(`filter ${filter.term} requires a dimension`)
      }
      if (!filter.operation) {
        throw Error(`filter ${filter.term} requires an operation`)
      }
      if (!(filter.arg || filter.args || filter.argList)) {
        throw Error(`filter ${filter.term} requires an argument`)
      }
    }

    for (const filter of filtersOfDimension(viewDimension)) {
      currentView.value.clearFilter(filter)
    }
    for (const filter of newFilters) {

      const newFilter = new Filter({
        term: rdf.blankNode(),
        parent: currentView.value,
        dimension: viewDimension,
        operation: filter.operation,
        arg: filter.argList ?? filter.arg,
        argList: !!filter.argList
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
