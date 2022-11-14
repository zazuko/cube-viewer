/* eslint-disable */
import rdf from 'rdf-ext'
import * as ns from '../../namespace.js'

function isLabelDimension (dimension) {
  return !!dimension.ptr.has(ns.view.labelFor).term
}

function getLabelCubeDimension ({
  dimension,
  view
}) {
  const labelDimension = dimension.ptr.in(ns.view.labelFor).term
  if (labelDimension) {
    const viewLabelDimension = view.dimensions.find(dimension => {
      return dimension.ptr.term.equals(labelDimension)
    })
    return viewLabelDimension ? viewLabelDimension.cubeDimensions[0] : undefined
  }
}

function getEffectiveDimensions ({ view }) {
  if (view) {
    const viewDimensions = view.projectionDimensions
    if (viewDimensions) {
      return viewDimensions.filter(dim => !isLabelDimension(dim))
        .map(dimension => {
          return {
          viewDimension: dimension,
          cubeDimension: dimension.cubeDimensions[0],
          labelCubePath: getLabelCubeDimension({
            dimension,
            view
          })?.path
        }})
    }
  }
  return []
}

function isLabelDimensionTarget ({
  cubePathStr,
  view
}) {
  const viewDimension = view.dimension({ cubeDimension: rdf.namedNode(cubePathStr) })
  return !!(viewDimension && viewDimension.ptr.in(ns.view.labelFor).term)
}

export { getEffectiveDimensions, isLabelDimensionTarget }
