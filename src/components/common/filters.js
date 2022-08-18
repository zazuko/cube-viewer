/* eslint-disable */
import { Filter } from 'rdf-cube-view-query/index.js'

function toTerm (obj) {

  if (obj.termType === 'NamedNode') {
    return obj
  }
  if (obj.term) {
    return obj.term
  }
  throw Error('Could not retrieve term')
}

function filtersToView ({
  view,
  filters
}) {

  // Delete old filters
  // I need to know how the API is supposed to work
  view.clearFilters()

  // @TODO this should be referenced not by the path, but by the cube,
  // since there can be more than one cube for a path
  for (const [dimensionPath, dimensionFilters] of filters.entries()) {
    for (const {
      operation,
      arg
    } of dimensionFilters) {
      // const operationTerm = operation.term ? operation.term : operation
      const viewDimension = view.dimension({ cubeDimension: dimensionPath })
      view.addFilter(new Filter({
        dimension: viewDimension,
        operation: toTerm(operation),
        arg
      }))
    }
  }
  return view
}

function filtersFromView (view) {
  // Get the filters in the form of records Path->Set:Filter
  // @TODO use View Dimensions directly instead of CubeDimensions
  const filters = new Map()
  const viewDimensionCubePath = {}

  for (const dimension of view.dimensions) {
    const cubeDimension = dimension.cubeDimensions[0]
    if (cubeDimension) {
      viewDimensionCubePath[dimension.term.value] = cubeDimension.path.value
      filters.set(cubeDimension.path.value, [])
    } else {
      console.log('No cube dimension for !', dimension.term)
    }
  }

  for (const filter of view.filters) {
    const path = viewDimensionCubePath[filter.dimension.value]
    const viewDimension = view.dimensions.find(dimension => dimension.term.equals(filter.dimension))

    // This is the way the filter Vue component likes it.
    filters.get(path).push({
      dimension: viewDimension.cubeDimensions[0],
      operation: toTerm(filter.operation),
      arg: filter.arg
    })
  }

  return filters
}

export { filtersToView, filtersFromView }
