/* eslint-disable */
import { CubeSource, View } from 'rdf-cube-view-query/index.js'
import { ViewBuilder } from 'rdf-cube-view-query/lib/builders.js'
import * as ns from '../../namespace.js'
import { cubeDimensionsWithFallBack } from './cubeDimensions.js'
import { DEFAULT_PAGE_SIZE } from './projection.js'

async function viewFromCubeUri ({ source, cubeUri }) {
  const cube = await source.cube(cubeUri)
  cube.source = CubeSource.fromSource(cube.source, cube)
  const view = View.fromCube(cube)
  checkCubeDimensions({view})
  return applyDefaults({ view })
}

async function viewFromViewUri ({ source, viewUri }) {
  const view = await source.view(viewUri)
  await view.fetchCubesShapes()
  checkCubeDimensions({view})
  return applyDefaults({ view })
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
  checkCubeDimensions({view})
  return applyDefaults({ view })
}

function checkCubeDimensions ({ view }) {
  for (const dimension of view.dimensions) {

    const cubeDimensions = cubeDimensionsWithFallBack({ dimension })

    if (!cubeDimensions.length) {
      throw Error(`no cube-dimensions found for view-dimension ${dimension.ptr.value}, through cube:observationConstraint`)
    }
    for (const cubeDimension of cubeDimensions) {
      if (!cubeDimension.path) {
        throw Error(`no path found for ${cubeDimension.ptr.value}`)
      }
    }
  }
}

function applyDefaults ({ view }) {
  // If there isn't a projection with a limit, add one with default values
  const offset = view.offset() ?? 0
  const pageSize = view.limit() ?? DEFAULT_PAGE_SIZE
  view.offset(offset)
  view.limit(pageSize)

  if (!view.projectionDimensions) {
    throw Error('requires a projection with dimensions defined')
  }

  return view
}


export {
  viewFromCubeUri, viewFromDataset, viewFromViewUri
}
