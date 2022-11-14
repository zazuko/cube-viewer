/* eslint-disable */
import * as ns from '../../namespace.js'
import { toViewDimension } from './cubeDimensions.js'
const DEFAULT_PAGE_SIZE = 10

function getSorting (view) {
  const orderBy = view.orderBy()

  if (!orderBy) {
    return {
      sortDimension: null,
      sortDirection: ns.view.Ascending,
    }
  } else if (orderBy.length===1) {
    const {
      sortDimension,
      sortDirection
    } = orderBy[0]
    return {
      sortDimension,
      sortDirection
    }
  } else if (orderBy.length>1){
    throw Error('Only one criterion supported')
  }

}

function projectionFromView (view) {
  const offset = view.offset() ?? 0
  const pageSize = view.limit() ?? DEFAULT_PAGE_SIZE
  const page = Math.floor(offset / pageSize) + 1
  const {
    sortDimension,
    sortDirection
  } = getSorting(view)
  return {
    page,
    pageSize,
    sortDimension,
    sortDirection
  }
}

function updateViewProjection ({
  view,
  projection
}) {
  const {
    page,
    pageSize,
    sortDimension,
    sortDirection
  } = projection

  if (!view) {
    return view
  }

  const limit = pageSize
  const offset = (page - 1) * pageSize

  function getOrderBy (cubeDimension, sortDirection) {
    if (!cubeDimension) {
      return null
    }
    const orderDimension = toViewDimension({
      view,
      cubeDimension
    })
    return [
      {
        dimension: orderDimension.ptr.term,
        direction: sortDirection
      }]
  }
  const orderBy = getOrderBy(sortDimension,sortDirection)
  view.updateProjection({
    offset,
    limit,
    orderBy: orderBy
  })
  return view
}


export {
  projectionFromView, updateViewProjection, DEFAULT_PAGE_SIZE
}
