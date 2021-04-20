import namespace from '@rdfjs/namespace'
import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import { shrink as _shrink } from '@zazuko/rdf-vocabularies/shrink'
import { expand as _expand } from '@zazuko/rdf-vocabularies/expand'

export const cube = namespace('https://cube.link/')
export const meta = namespace('https://cube.link/meta/')
export const qudt = namespace(prefixes.qudt)
export const rdf = namespace(prefixes.rdf)
export const schema = namespace(prefixes.schema)
export const sh = namespace(prefixes.sh)
export const time = namespace(prefixes.time)
export const view = namespace('https://cube.link/view/')

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
