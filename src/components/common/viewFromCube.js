import { Filter, View } from 'rdf-cube-view-query'
import * as ns from '../../namespace.js'

function viewFromCube ({ cube }, options = {
  page: 1,
  pageSize: 10,
  sortDimension: null,
  sortDirection: ns.view.Ascending,
}) {
  const {
    page,
    pageSize,
    sortDimension,
    sortDirection,
  } = options

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
  const filters = new Map()
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

export { viewFromCube }
