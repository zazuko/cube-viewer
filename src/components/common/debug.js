import rdf from 'rdf-ext'

function getBoundedViewPointer (view) {
  const { term, dataset } = getBoundedDescription({
    term: view.term,
    dataset: view.dataset,
  })
  return rdf.clownface({ term, dataset })
}

function getBoundedDescription ({
  term,
  dataset,
}) {
  const descriptionWithBlankNodes = rdf.traverser(({
    dataset,
    level,
    quad,
  }) => level === 0 || (quad.subject.termType === 'BlankNode' && level < 20))
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
export { getBoundedViewPointer }
