/* eslint-disable */

import rdf from 'rdf-ext'

export const viewNs = rdf.namespace('https://cube.link/view/')
export const schemaNs = rdf.namespace('http://schema.org/')

function getLabel (ptr, { language }) {
  return ptr.out(schemaNs.name, { language })
}

function getColumnHeaderLabel ({
  dimension,
  viewDimension,
  view
}, { language }) {
  const label = getLabel(dimension.ptr, { language })
  if (label.value) {
    return { value: label.value }
  }
  // If there is no label defined in the constraint, try to get it from the target
  const joinDimension = viewDimension.ptr.out(viewNs.from).out(viewNs.join).term
  if (joinDimension) {
    const targetDimension = view.dimensions.find(x => x.term.equals(joinDimension))
    const cubeDimensions = targetDimension.cubeDimensions
    if (cubeDimensions.length) {
      const joinLabel = getLabel(cubeDimensions[0].ptr, { language })
      return {
        value: joinLabel.value,
        joined: cubeDimensions[0].ptr.term
      }
    }
  }
}

export { getColumnHeaderLabel }
