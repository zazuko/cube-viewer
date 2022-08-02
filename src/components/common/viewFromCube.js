/* eslint-disable */

import { Filter, View, CubeSource } from 'rdf-cube-view-query'
import * as ns from '../../namespace.js'

const DEFAULT_CONTROLS = {
  page: 1,
  pageSize: 10,
  sortDimension: null,
  sortDirection: ns.view.Ascending,
  filters: new Map()
}

function getSorting (projection) {
  const orderBy = projection.out(ns.view.orderBy)
  if (orderBy.isList()) {
    const criterion = [...orderBy.list()][0]
    return {
      sortDimension: criterion.out(ns.view.dimension).term,
      sortDirection: criterion.out(ns.view.direction).term
    }
  } else {
    return {
      sortDimension: null,
      sortDirection: ns.view.Ascending
    }
  }
}

function projectionFromView (view) {

  const projection = view.ptr.out(ns.view.projection)
  const pageSize = projection.out(ns.view.limit).value ? parseInt(projection.out(ns.view.limit).value) : DEFAULT_CONTROLS.pageSize
  const offset = projection.out(ns.view.offset).value
  const page = Math.floor(offset / pageSize) + 1
  const {
    sortDimension,
    sortDirection
  } = getSorting(projection)

  // Get the filters in the form of records Path->Set:Filter
  // @TODO use dimensions directly
  const filters = new Map()
  const pathsForDimension = {}
  for (const dimension of view.dimensions) {
    const cubeDimension = dimension.cubeDimensions[0]
    pathsForDimension[dimension.term.value] = cubeDimension.path.value
    filters.set(cubeDimension.path.value, [])
  }
  for (const filter of view.filters) {
    if(filter.length) {
      const path = pathsForDimension[filter[0].dimension.value]
      filters.get(path).push(filter)
    }
  }

  return {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters
  }
}

function viewFromCube ({ cube }, controls = DEFAULT_CONTROLS) {
  const {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters
  } = controls

  cube.source = CubeSource.fromSource(cube.source, cube)
  const view = View.fromCube(cube)

  // A view always comes with a projection
  const projection = view.ptr.out(ns.view.projection)

  // Add view sorting and pagination
  const offset = (page - 1) * pageSize

  projection.addOut(ns.view.limit, pageSize)
  projection.addOut(ns.view.offset, offset)

  if (sortDimension) {
    // Passing `path` because there's a bug in the library that doesn't
    // handle dimension comparison properly
    const orderDimension = view.dimension({ cubeDimension: sortDimension.path })
    const order = projection.blankNode()
      .addOut(ns.view.dimension, orderDimension.ptr)
      .addOut(ns.view.direction, sortDirection)

    projection.addList(ns.view.orderBy, order)
  }

  // Add view filters
  const viewFilters = [...filters.entries()].map(([dimensionPath, dimensionFilters]) => dimensionFilters.map(({
    operation,
    arg
  }) => {
    const viewDimension = view.dimension({ cubeDimension: dimensionPath })

    return new Filter({
      dimension: viewDimension,
      operation: operation.term,
      arg
    })
  }))

  for (const filter of viewFilters) {
    view.addFilter(filter)
  }

  return view
}

export { viewFromCube, projectionFromView }
