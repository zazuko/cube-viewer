/* eslint-disable */

import { Filter, View } from 'rdf-cube-view-query'
import * as ns from '../../namespace.js'

const DEFAULT_PAGE_SIZE = 10

function controlsFromView (view) {

  const projection = view.ptr.out(ns.view.projection)
  const pageSize = projection.out(ns.view.limit).value ? parseInt(projection.out(ns.view.limit).value) : DEFAULT_PAGE_SIZE
  const offset = projection.out(ns.view.offset).value
  const page = Math.floor(offset / pageSize) + 1

  const filters = new Map()
  const sortDimension = null
  const sortDirection = ns.view.Ascending

  // @TODO dimensions from view
  // @TODO filters from view
  for (const dimension of view.dimensions) {
    const cubeDimension = dimension.cubeDimensions[0]
    filters.set(cubeDimension.path.value, [])
  }

  return {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters
  }
}

function viewFromCube ({ cube }, controls = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sortDimension: null,
  sortDirection: ns.view.Ascending,
  filters: new Map()
}) {
  const {
    page,
    pageSize,
    sortDimension,
    sortDirection,
    filters
  } = controls

  const view = View.fromCube(cube)

  // Add view sorting and pagination
  view.ptr.addOut(ns.view.projection, projection => {
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
  })
  // Add view filters
  const viewFilters = [...filters.entries()].map(([dimensionPath, dimensionFilters]) => dimensionFilters.map(({
    operation,
    arg,
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

export { viewFromCube, controlsFromView }
