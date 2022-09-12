/* eslint-disable */
import { defineStore } from 'pinia'
import rdf from 'rdf-ext'
import { ref } from 'vue'
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

function getShortLabel (base, term) {
  if (term.termType === 'Literal') {
    return term.value
  }
  const string = term.value
  const result = ns.shrink(string, base)
  // @TODO find a better heuristic
  if (result === string) { // If the term was not modified, try again with a shorter base
    return ns.shrink(string, base.split('/').splice(0, this.base.split('/').length - 1).join('/'))
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
    base.value = pointer.value.term.value
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

  function getDisplayString (term, options) {

    const withTypes = options?.withTypes ?? true
    if (term.termType === 'Literal') {
      const datatype = (withTypes && term.datatype) ? `^^${getShortLabel(base.value, term.datatype)}` : ''
      const language = (withTypes && term.language) ? `@${term.language}` : ''
      return `"${term.value}${language}"${datatype}`
    } else {
      return term.value
    }
  }

  return {
    language,
    pointer,
    setPointers,
    getDisplayTerm,
    getDisplayString
  }
})

export { observationsTermsWithNoLabel, shaclTermsWithNoLabel }
export default useLangStore
