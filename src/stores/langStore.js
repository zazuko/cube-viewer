/* eslint-disable */
import { defineStore } from 'pinia'
import rdf from 'rdf-ext'
import { ref } from 'vue'
import { getOperationLabel } from '../model/operation.js'
import * as ns from '../namespace.js'

const defaultLanguage = ['en', '*']

function shaclTermsWithNoLabel (view, pointer) {
  const result = rdf.termSet()
  view.dimensions.forEach(dimension => {
    dimension.cubeDimensions.forEach(cubeDimension => {
      cubeDimension.in.filter(term => term.termType === 'NamedNode').forEach(named => {
        if (!pointer.node(named).out(ns.schema.name).value) {
          result.add(named)
        }
      })
    })
  })
  return result
}

function observationsTermsWithNoLabel (observations, pointer) {
  const result = rdf.termSet()

  for (const row of observations?.data ?? []) {
    for (const [, value] of Object.entries(row)) {
      if (value.termType === 'NamedNode') {
        if (!pointer.node(value).out(ns.schema.name).value) {
          result.add(value)
        }
      }
    }
  }
  return result
}

function getShortLabel (term, base) {
  const isString = (val) => (typeof val === 'string' || val instanceof String)
  const termString = isString(term) ? term : term.value
  const baseString = isString(base) ? base : base.value

  const result = ns.shrink(termString, baseString)
  // @TODO find a better heuristic
  if (result === termString) { // If the term was not modified, try again with a shorter base
    return ns.shrink(termString, baseString.split('/').splice(0, baseString.split('/').length - 1).join('/'))
  }
  return result
}

const useLangStore = defineStore('langStore', () => {

  // State
  const language = ref(defaultLanguage) // The current application language
  const base = ref('') // Used to shrink labels
  const pointer = ref(rdf.clownface()) // The current data cache

  // Getters
  function setPointers (view) {
    const cubeTerm = view.dimensions[0].cubes[0]
    pointer.value = view.ptr.node(cubeTerm)
    base.value = pointer.value.term
  }

  function getDisplayTerm (term) {
    if (!term) {
      return undefined
    }
    if (term.termType === 'NamedNode') {
      return (
        pointer.value.node(term).out(ns.schema.name, { language: language.value }).term ||
        pointer.value.node(term).out(ns.rdfs.label, { language: language.value }).term ||
        term
      )
    }
    return term
  }

  function getDisplayString (term, withTypes = false) {
    if (term.termType === 'Literal') {
      const datatype = (withTypes && term.datatype) ? `^^${getShortLabel(term.datatype, base.value, )}` : ''
      const language = (withTypes && term.language) ? `@${term.language}` : ''
      return `"${term.value}${language}"${datatype}`
    } else {
      return getShortLabel(term, base.value )
    }
  }

  function getFilterLabel({ operation, arg, args, argsList }){
    function getLabel (term) {
      const displayTerm = getDisplayTerm(term)
      return getDisplayString(displayTerm)
    }
    const operationLabel = getOperationLabel(operation)

    const argLabel = arg ? getLabel(arg) : ''
    const argsLabel = (!arg && args) ? `${args.map(getLabel).join(',')}` : ''
    const argsListLabel = argsList ? `[${argsList.map(getLabel).join(',')}]` : ''
    return `${operationLabel} ${argLabel}${argsLabel}${argsListLabel}`
  }


  return {
    language,
    pointer,
    setPointers,
    getDisplayTerm,
    getDisplayString,
    getFilterLabel
  }
})

export { observationsTermsWithNoLabel, shaclTermsWithNoLabel, getShortLabel }
export default useLangStore
