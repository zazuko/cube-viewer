/* eslint-disable */
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

function getOperationLabel (term) {
  for (const current of operations) {
    if (current.term.equals(term)) {
      return current.label
    }
  }
}

export { operations, getOperationLabel }
