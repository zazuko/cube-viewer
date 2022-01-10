import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import { shrink as _shrink } from '@zazuko/rdf-vocabularies/shrink'
import { expand as _expand } from '@zazuko/rdf-vocabularies/expand'
import RDF from './rdf'

export const cube = RDF.namespace('https://cube.link/')
export const meta = RDF.namespace('https://cube.link/meta/')
export const qudt = RDF.namespace(prefixes.qudt)
export const rdf = RDF.namespace(prefixes.rdf)
export const schema = RDF.namespace(prefixes.schema)
export const sh = RDF.namespace(prefixes.sh)
export const time = RDF.namespace(prefixes.time)
export const view = RDF.namespace('https://cube.link/view/')

export function expand (uri) {
  if (uri && !uri.includes(':')) return uri

  if (uri.startsWith('http://')) return uri

  try {
    return _expand(uri)
  } catch {
    return uri
  }
}

export function shrink (uri, customBase) {
  if (customBase && uri.startsWith(customBase)) {
    return uri.replace(customBase, '').replace(/^[/#]/, '')
  } else {
    return _shrink(uri) || uri
  }
}
