
<script setup>
/* eslint-disable */
import { XCircleIcon } from '@heroicons/vue/outline'
import queue from 'promise-the-world/queue.js'
import { LookupSource, Source, View } from 'rdf-cube-view-query'
import rdf from 'rdf-ext'
import { computed, defineComponent, defineEmits, defineProps, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import { getBoundedViewPointer } from './common/debug.js'
import { filtersFromView, filtersToView } from './common/filters.js'
import { projectionFromView, updateViewProjection } from './common/projection.js'
import DebugBox from './debug/DebugBox.vue'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'

const emit = defineEmits(['updateDataset'])

const props = defineProps({
  view: {
    type: Object,
    required: true,
  },
  language: {
    type: [String, Array],
    required: true,
  },
})

const currentView = shallowRef()
const debugOpen = ref(false)
const debugCounter = ref(1)

const cubePointer = ref()
const filters = ref()
const page = ref()
const pageSize = ref()
const sortDimension = shallowRef()
const sortDirection = shallowRef()
const cubeDimensions = ref()
const queryQueue = queue(1)

// Used when controls change
const updateObservations = async () => {
  let v = updateViewProjection({
    view: currentView.value,
    projection: {
      page: page.value,
      pageSize: pageSize.value,
      sortDimension: sortDimension.value,
      sortDirection: sortDirection.value,
      filters: filters.value
    }
  })
  v = filtersToView({
    view: v,
    filters: filters.value
  })
  await fetchObservations(v)
  currentView.value = v
  debugCounter.value = debugCounter.value + 1
}

const observations = ref(Remote.loading())
const observationCount = ref(Remote.loading())
const fetchObservations = async (view) => {
  observations.value = Remote.loading()
  if (!view) return
  await queryQueue.add(async () => {
    try {
      observations.value = await Remote.fetch(view.observations.bind(view))
    } catch (error){
      console.log(error)
      console.log('view that produced the error')
      console.log(getBoundedViewPointer(view).dataset.toString())
    }
  })
  await queryQueue.add(async () => {
    observationCount.value = await Remote.fetch(view.observationCount.bind(view))
  })
}


// Labels are stored as Record<dimensionURI, Clownface>
const labels = ref({})
const fetchLabels = async (view) => {
  if (!view || !view) return

  const dimensions = view.dimensions

  const dimensionsWithLabels = await Promise.all(dimensions.map(dimension => {
    return queryQueue.add(async () => fetchDimensionLabels(dimension, view))
  }))

  return dimensionsWithLabels.filter(notNull => notNull).reduce(
    (acc, [dimensionPath, dimensionLabels]) => ({
      ...acc,
      [dimensionPath.value]: dimensionLabels
    }),
    {}
  )
}

function initProjection (view) {
  // Get all the controls from the view
  const projection = projectionFromView(view)
  page.value = projection.page
  pageSize.value = projection.pageSize
  sortDimension.value = projection.sortDimension
  sortDirection.value = projection.sortDirection
}

function initFilters (view) {
  // Load filters
  filters.value = filtersFromView(view)
  cubeDimensions.value = view.dimensions.map(dimension => dimension.cubeDimensions[0]).filter(notNull => notNull)
}

function initView (view) {
  initProjection(view)
  initFilters(view)
  fetchObservations(view)
  fetchLabels(view)

  currentView.value = view
  debugCounter.value = debugCounter.value + 1
}


onMounted(()=>{
  const cubeTerm = props.view.dimensions[0].cubes[0]
  cubePointer.value = props.view.ptr.node(cubeTerm)
  initView(props.view)
})

watch(() => props.view, () => initView(props.view))


const filtersSummary = computed(() => {
  const language = props.language
  const ptr = props.view.ptr
  const cube = props.view.cubes()[0]
  return [...filters.value.entries()].flatMap(([dimensionPath, dimensionFilters]) =>
    dimensionFilters.map(({
      dimension,
      operation,
      arg,
    }, index) => {
      const dimensionLabel = dimension.out(ns.schema.name, { language }).value
      // const dimensionLabel = ptr.node(dimension).out(ns.schema.name, { language }).value
      const dimensionValueLabels = labels.value[dimension.path.value]
      const valueLabel = (
        dimensionValueLabels?.node(arg).out(ns.schema.name, { language }).value ||
        ptr.node(arg).out(ns.schema.name, { language }).value ||
        ns.shrink(arg.value, cube.value)
      )
      return {
        dimensionPath,
        index,
        label: `${dimensionLabel} ${operation.label} ${valueLabel}`,
      }}))
})

function updateDataset (arg) {
  emit('updateDataset', arg)
}

function isNumericScale (dimension) {
  const scaleType = dimension.ptr.out(ns.qudt.scaleType).term
  return ns.qudt.RatioScale.equals(scaleType) || ns.qudt.IntervalScale.equals(scaleType)
}

function isMeasureDimension (dimension) {
  return !!dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term
}

function updatePage (pageArg) {
  page.value = pageArg
  updateObservations()
}

function updatePageSize (pageSizeArg) {
  pageSize.value = pageSizeArg
  updateObservations()
}

function updateSort (dimension, direction) {
  sortDimension.value = dimension
  sortDirection.value = direction
  updateObservations()
}

function updateDimensionFilters (cubeDimensionArg, filtersArg) {
  filters.value.set(cubeDimensionArg.path.value, filtersArg)
  updateObservations()
}

function removeFilter ({
  dimensionPath,
  index,
}) {
  filters.value.get(dimensionPath).splice(index, 1)
  updateObservations()
}

const fetchDimensionLabels = async (dimension, cubeSource) => {
  const cubeDimension = dimension.cubeDimensions[0]
  if (!cubeDimension) return undefined
  const path = cubeDimension.path

  const dimensionLabels = rdf.clownface({ dataset: rdf.dataset() })

  if (ns.sh.IRI.equals(cubeDimension.out(ns.sh.nodeKind).term)) {
    const view = new View({ parent: cubeSource })

    const source = LookupSource.fromSource(dimension.source)

    view.addDimension(dimension)
    view.addDimension(view.createDimension({
      source,
      path: ns.schema.name,
      join: dimension,
      as: ns.schema.name,
    }))

    const data = await view.observations()
    for (const row of data) {
      const term = row[path.value]
      const label = row[ns.schema.name.value]
      dimensionLabels.node(term).addOut(ns.schema.name, label)
    }
  }
  return [path, dimensionLabels]
}

defineExpose({
  currentView,
})

</script>

<template>

  <div>
    <template v-if="cubeDimensions">
      <!-- h-1 is a hack to make the header cells layout work -->
      <table class="h-1">
        <thead>
        <tr>
          <th v-for="dimension in cubeDimensions" :key="dimension.ptr.term.value"
              class="border border-b-2 align-top text-left h-full">
            <dimension-header
              :base="cubePointer.term.value"
              :dimension="dimension"
              :language="language"
              :labels="labels[dimension.path.value]"
              :sort-dimension="sortDimension"
              :sort-direction="sortDirection"
              :filters="filters.get(dimension.path.value)"
              @updateSort="updateSort"
              @update:filters="updateDimensionFilters"
            />
          </th>
        </tr>
        <tr v-show="filtersSummary.length > 0">
          <td :colspan="cubeDimensions.length" class="border px-2 py-2">
            <div class="flex gap-2 justify-start">
              <span v-for="(filter, index) in filtersSummary" :key="index"
                    class="tag bg-gray-100 rounded-md flex items-center gap-1">
                <span>{{ filter.label }}</span>
                <button title="Remove filter" @click="removeFilter(filter)" class="button-text">
                  <x-circle-icon class="w-5 h-5"/>
                </button>
              </span>
            </div>
          </td>
        </tr>
        </thead>
        <tbody v-if="observations.isLoading">
        <tr v-for="i in Array(pageSize)" :key="i">
          <td :colspan="cubeDimensions.length" class="border px-2 py-2">
            <loading-icon/>
          </td>
        </tr>
        </tbody>
        <tbody v-else-if="observations.error">
        <tr>
          <td :colspan="cubeDimensions.length" class="border px-2 py-1">
            {{ observations.error }}
          </td>
        </tr>
        </tbody>
        <tbody v-else>
        <tr v-for="(observation, index) in observations.data" :key="index">
          <td
            v-for="dimension in cubeDimensions"
            :key="dimension.ptr.term.value"
            class="border px-2 py-1 whitespace-nowrap"
            :class="{
                'text-right tabular-nums': isNumericScale(dimension),
                'bg-primary-50': isMeasureDimension(dimension),
              }"
          >
            <observation-value
              :value="observation[dimension.path.value]"
              :pointer="cubePointer"
              :labels="labels[dimension.path.value]"
              :language="language"
            />
          </td>
        </tr>
        </tbody>
      </table>

      <pagination-menu
        :page="page"
        :pageSize="pageSize"
        :items-count="observationCount"
        @update:page="updatePage"
        @update:pageSize="updatePageSize"
      />

    </template>

    <div>
      <button class="flex items-start text-left leading-tight"
              @click="debugOpen=!debugOpen">
        <span class="text-gray-500 py-3">toggle debug</span>
      </button>
      <DebugBox
        :key="debugCounter"
        v-if="debugOpen===true"
        :debugView="currentView"
        @updateDataset="updateDataset"
      />
    </div>
  </div>
</template>
