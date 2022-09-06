/* eslint-disable */
import { Filter } from 'rdf-cube-view-query/index.js'
import * as ns from '../../namespace.js'

const operations = [
  {
    term: ns.view.Eq,
    label: '='
  },
  {
    term: ns.view.Ne,
    label: '!='
  },
  {
    term: ns.view.In,
    label: 'in'
  },
  {
    term: ns.view.Lt,
    label: '<'
  },
  {
    term: ns.view.Lte,
    label: '<='
  },
  {
    term: ns.view.Gt,
    label: '>'
  },
  {
    term: ns.view.Gte,
    label: '>='
  }
]

function toTerm (obj) {

  if (obj.termType === 'NamedNode') {
    return obj
  }
  if (obj.term) {
    return obj.term
  }
  throw Error('Could not retrieve term')
}

function filtersToView ({
  view,
  filters
}) {

  // Delete old filters
  // I need to know how the API is supposed to work
  view.clearFilters()

  for (const {
    dimension,
    operation,
    arg
  } of filters) {
    const viewDimension = view.dimension({ cubeDimension: { path: dimension.path } })
    view.addFilter(new Filter({
      dimension: viewDimension,
      operation: toTerm(operation),
      arg
    }))
  }
  return view
}

function getOperation (term) {
  for (const current of operations) {
    if (current.term.equals(term)) {
      return current
    }
  }
}

function filtersFromView (view) {
  // Get the filters in the form of records Path->Set:Filter
  const filters = []
  const viewDimensionCubePath = {}
  for (const dimension of view.dimensions) {
    const cubeDimension = dimension.cubeDimensions[0]
    if (cubeDimension) {
      viewDimensionCubePath[dimension.term.value] = cubeDimension.path.value
    } else {
      console.log('No cube dimension for !', dimension.term)
    }
  }
  for (const filter of view.filters) {
    const viewDimension = view.dimensions.find(dimension => dimension.term.equals(filter.dimension))
    filters.push({
      dimension: viewDimension.cubeDimensions[0],
      operation: getOperation(filter.operation), // @TODO use the term and use the langStore
      arg: filter.arg
    })
  }

  return filters
}

export { filtersToView, filtersFromView, operations }
