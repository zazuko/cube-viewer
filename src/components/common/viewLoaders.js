/* eslint-disable */
import { CubeSource, View } from 'rdf-cube-view-query/index.js'
import { ViewBuilder } from 'rdf-cube-view-query/lib/viewUtils.js'
import * as ns from '../../namespace.js'
import { DEFAULT_PAGE_SIZE } from './projection.js'

function viewFromCube ({ cube }) {
  cube.source = CubeSource.fromSource(cube.source, cube)
  return View.fromCube(cube)
}

async function viewFromDataset ({
  dataset,
  fallbackSource
}) {
  const views = [...dataset.match(null, ns.rdf.type, ns.view.View)]
  if (views.length < 1) {
    return undefined
  }
  const {
    view
  } = ViewBuilder.fromDataset({
    term: views[0].subject,
    dataset
  })
  if (view.sources().length < 1) {
    view.source = fallbackSource
  }
  await view.fetchCubesShapes()
  return view
}

function applyDefaults ({ view }) {
  // If there isn't a projection with a limit, add one with default values
  const offset = view.offset() ?? 0
  const pageSize = view.limit() ?? DEFAULT_PAGE_SIZE
  view.offset(offset)
  view.limit(pageSize)
  return view
}

export {
  viewFromCube, applyDefaults, viewFromDataset
}
