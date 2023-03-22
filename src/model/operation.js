/* eslint-disable */
import * as ns from '../namespace.js'

const operations = [
  {
    term: ns.view.Eq,
    label: '='
  },
  {
    term: ns.view.Ne,
    label: '!=',
    multipleValues: true
  },
  {
    term: ns.view.In,
    label: 'in',
    multipleValues: true
  },
  {
    term: ns.view.Lt,
    label: '<',
    onlyLiterals: true
  },
  {
    term: ns.view.Lte,
    label: '<=',
    onlyLiterals: true
  },
  {
    term: ns.view.Gt,
    label: '>',
    onlyLiterals: true
  },
  {
    term: ns.view.Gte,
    label: '>=',
    onlyLiterals: true
  }
]

function getOperationLabel (term) {
  for (const current of operations) {
    if (current.term.equals(term)) {
      return current.label
    }
  }
}

export {
  operations,
  getOperationLabel
}
