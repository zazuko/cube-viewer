import rdf from 'rdf-ext'
import * as ns from '../../namespace.js'

function getViewQuads (view, cubeTerm) {
  const { dataset } = getBoundedDescription({
    term: view.term,
    dataset: view.dataset,
  })

  // Add the cube constraints, which needed by the cube-viewer
  for (const quad of view.dataset.match(cubeTerm, ns.cube.observationConstraint, null)) {
    dataset.add(quad)
  }
  return [...dataset]
}

function getBoundedDescription ({
  term,
  dataset,
}) {
  const descriptionWithBlankNodes = rdf.traverser(({
    dataset,
    level,
    quad,
  }) => level === 0 || (quad.subject.termType === 'BlankNode' && level < 5))
  const result = rdf.dataset()
  result.addAll(descriptionWithBlankNodes.match({
    term,
    dataset,
  }))

  return {
    term,
    dataset: result,
  }
}
export { getViewQuads }
