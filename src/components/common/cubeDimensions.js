/* eslint-disable */

import rdf from 'rdf-ext'

const viewAsNN = rdf.namedNode('https://cube.link/view/as')
const viewFrom = rdf.namedNode('https://cube.link/view/from')

function toViewDimension ({
  view,
  cubeDimension
}) {
  const result = view.dimension({ cubeDimension })
  if (!result) {
    const cubeDimensionTerm = cubeDimension.ptr ? cubeDimension.ptr.term : cubeDimension
    for (const dimension of view.dimensions) {
      const viewAs = dimension.ptr.out(viewAsNN).term
      if (viewAs && viewAs.equals(cubeDimensionTerm)) {
        return dimension
      }
    }
    // If there is no view dimension using viewAs try viewFrom
    for (const dimension of view.dimensions) {
      const viewFromTerm = dimension.ptr.out(viewFrom).term
      if (viewFromTerm && viewFromTerm.equals(cubeDimensionTerm)) {
        return dimension
      }
    }
    console.log(`No dimension found for`, cubeDimensionTerm.value)
  }
  return result
}

function cubeDimensionsWithFallBack ({ dimension }) {
  const result = dimension.cubeDimensions

  if (result.length > 0) {
    return result
  }

  const cubeDimensions = dimension.ptr.out(viewFrom).terms
  return cubeDimensions.map(term => ({
    term: term,
    ptr: dimension.ptr.node(term),
    path: dimension.ptr.out(viewAsNN).term,
    dataset: dimension.dataset,
    graph: dimension.graph,
    in: []
  }))
}

export { toViewDimension, cubeDimensionsWithFallBack }
