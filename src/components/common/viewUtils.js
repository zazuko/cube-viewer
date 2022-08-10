/* eslint-disable */

import { CubeSource, Filter, View } from 'rdf-cube-view-query'
import { ViewBuilder } from 'rdf-cube-view-query/lib/viewUtils.js'
import * as ns from '../../namespace.js'

const DEFAULT_PROJECTION = {
  page: 1,
  pageSize: 10,
  sortDimension: null,
  sortDirection: ns.view.Ascending,
  filters: new Map()
}

function getSorting (view) {
  const orderBy = view.orderBy()

  if (!orderBy) {
    return {
      sortDimension: null,
      sortDirection: ns.view.Ascending,
    }
  } else if (orderBy.length===1){
    return {
      sortDimension: orderBy[0].dimension,
      sortDirection: orderBy[0].direction,
    }
  } else if (orderBy.length>1){
    throw Error('Only one criterion supported')
  }

}

function projectionFromView (view) {

  const offset = view.offset()??0
  const pageSize = view.limit()??DEFAULT_PROJECTION.pageSize
  const page = Math.floor(offset / pageSize) + 1
  const {
    sortDimension,
    sortDirection,
  } = getSorting(view)

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
      console.log('No cube dimension for !',dimension.term)
    }
  }

  for (const filter of view.filters) {
      const path = viewDimensionCubePath[filter.dimension.value]
      const viewDimension = view.dimensions.find(dimension=>dimension.term.equals(filter.dimension))

    // This is the way the filter Vue component likes it.
      filters.get(path).push({
        dimension:viewDimension.cubeDimensions[0],
        operation:filter.operation,
        arg:filter.arg
      })
  }

  return {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters,
  }
}

function updateViewProjection ({ view, controls }) {
  const {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters,
  } = controls

  const limit = pageSize
  const offset = (page - 1) * pageSize

  function getOrderBy(sortDimension,sortDirection){
    if (!sortDimension) {
      return null
    }
    // Passing `path` because there's a bug in the library that doesn't
    // handle dimension comparison properly
    const orderDimension = view.dimension({ cubeDimension: sortDimension.path })

    if (!orderDimension) {
      throw Error('No dimension found for ',sortDimension.path)
    }

    return [{ dimension: orderDimension.ptr.term,  direction: sortDirection }]
  }
  const orderBy = getOrderBy(sortDimension,sortDirection)

  view.updateProjection({ offset, limit, orderBy: orderBy })

  // Delete old filters
  view.ptr.out(ns.view.filter).deleteOut()
  view.ptr.deleteOut(ns.view.filter)

  // Add new view filters
  const viewFilters = [...filters.entries()].map(([dimensionPath, dimensionFilters]) => dimensionFilters.map(({
    operation,
    arg,
  }) => {
    const viewDimension = view.dimension({ cubeDimension: dimensionPath })
    return new Filter({
      dimension: viewDimension,
      operation: operation.term,
      arg,
    })
  }))

  for (const filter of viewFilters) {
    view.addFilter(filter)
  }
  return view
}

function viewFromCube ({ cube }, controls = DEFAULT_PROJECTION) {
  cube.source = CubeSource.fromSource(cube.source, cube)
  const view = View.fromCube(cube)
  updateViewProjection({
    view,
    controls
  })
  return view
}

async function viewFromDataset ({ dataset }) {

  const views = [...dataset.match(null, ns.rdf.type, ns.view.View)]
  console.log(views.length)
  if (!views.length){
    return undefined
  }
  const {
    view
  } = ViewBuilder.fromDataset({
    term: views[0].subject,
    dataset,

  })
  await view.fetchCubeShape()

  return view
}

function applyDefaults ({ view }) {
  // If there isn't a projection with a limit, add one with default values
  return view
}


export { viewFromCube, projectionFromView, updateViewProjection, applyDefaults, viewFromDataset
}
