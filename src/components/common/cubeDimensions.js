/* eslint-disable */

import { view } from '../../namespace.js'

function toViewDimension ({
  view,
  cubeDimension
}) {
  const result = view.dimension({ cubeDimension })
  if (!result) {
    const cubeDimensionTerm = cubeDimension.ptr?cubeDimension.ptr.term:cubeDimension
    // Try to fetch using view:as
    const candidate =  view.ptr.node(cubeDimensionTerm).in(view.as).term
    if (!candidate){
      throw Error('No dimension found for ', cubeDimensionTerm)
    }
    for (const dimension of view.dimensions){
      if (dimension.ptr.term.equals(candidate)) {
        return dimension
      }
    }
  }
  return result
}

function cubeDimensionsWithFallBack ({ dimension }) {
  const result = dimension.cubeDimensions

  if (result.length > 0) {
    return result
  }

  const cubeDimensions = dimension.ptr.out(view.from).terms
  return cubeDimensions.map(term => ({
    term: term,
    ptr: dimension.ptr.node(term),
    path: dimension.ptr.out(view.as).term,
    dataset: dimension.dataset,
    graph: dimension.graph,
    in: []
  }))
}

export { toViewDimension, cubeDimensionsWithFallBack }
