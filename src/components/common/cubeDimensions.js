/* eslint-disable */

import rdf from 'rdf-ext'
const viewAsNN = rdf.namedNode('https://cube.link/view/as')

function toViewDimension ({
  view, cubeDimension,
}) {
  const result = view.dimension({ cubeDimension })
  if (!result) {
    const cubeDimensionTerm = cubeDimension.ptr
      ? cubeDimension.ptr.term
      : cubeDimension
    for (const dimension of view.dimensions) {
      const viewAs = dimension.ptr.out(viewAsNN).term
      if (viewAs && viewAs.equals(cubeDimensionTerm)) {
        return dimension
      }
    }
    console.log(`No dimension found for`,cubeDimensionTerm.value)
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
    in: [],
  }))
}

export { toViewDimension, cubeDimensionsWithFallBack }
