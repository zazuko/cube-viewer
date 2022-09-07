
<script setup>
/* eslint-disable */
import { XCircleIcon } from '@heroicons/vue/outline'
import { storeToRefs } from 'pinia'
import queue from 'promise-the-world/queue.js'
import rdf from 'rdf-ext'
import { computed, defineEmits, defineProps, onMounted, ref, shallowRef, watch } from 'vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import useFilterStore from '../stores/filterStore.js'
import useLangStore, { observationsTermsWithNoLabel, shaclTermsWithNoLabel } from '../stores/langStore.js'
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
    required: true
  }
})

const currentView = shallowRef()
const page = ref()
const pageSize = ref()
const sortDimension = shallowRef()
const sortDirection = shallowRef()

const debugOpen = ref(false)
const debugCounter = ref(1)

const queryQueue = queue(1)

const langStore = useLangStore()
const {
  setPointers
} = langStore
const {
  language,
  pointer
} = storeToRefs(langStore)

const filterStore = useFilterStore()
const {
  filters
} = storeToRefs(filterStore)

// Used when controls change
const updateObservations = async () => {
  if (currentView.value) {
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
    await fetchObservationsAndLabels(v)
  }
}

const observations = ref(Remote.loading())
const observationCount = ref(Remote.loading())

const fetchObservations = async (view) => {
  console.log('fetch observations')
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

function initProjection (view) {
  // Get all the controls from the view
  const projection = projectionFromView(view)
  page.value = projection.page
  pageSize.value = projection.pageSize
  sortDimension.value = projection.sortDimension
  sortDirection.value = projection.sortDirection
}

function refreshObservations () {
  // Dirty hack since the view it's a shallow ref
  // It's to update the observations component and show the labels when they arrive
  debugCounter.value = debugCounter.value + 1
}

async function populateLabels (view, terms, callback) {
  const source = view.getMainSource()
  const uris = terms.map(x => `<${x.value}> `).join(', ')
  await queryQueue.add(async () => {
    console.log(`Fetching labels for ${terms.length} entities`)
    const result = await source.client.query.construct(`
CONSTRUCT {
      ?uri <http://schema.org/name> ?label .
    } where {
      ?uri <http://schema.org/name> ?label
      FILTER (?uri IN (${uris}))
}`)
    view.dataset.addAll(result)
    callback(view)
  })
}

async function fetchObservationsLabels (view) {
  const terms = observationsTermsWithNoLabel(observations.value, view.ptr)
  await populateLabels(view, [...terms], (view) => {
    currentView.value = view
    refreshObservations()
    console.log('fetch observations labels end')
  })
}

async function fetchObservationsAndLabels (view) {
  await fetchObservations(view)
  currentView.value = view
  fetchObservationsLabels(view)
}

function initFilters (view) {
  // Load filters
  filters.value = filtersFromView(view)
}

async function fetchShaclLabels (view) {
  const terms = [...shaclTermsWithNoLabel(view, view.ptr)]
  const chunkSize = 50
  while (terms.length) {
    const chunk = terms.splice(0, chunkSize)
    populateLabels(view, chunk, (view) => {
      console.log('fetch shacl labels end')
    })
  }
}

async function initView (view) {
  setPointers(view)
  initProjection(view)
  initFilters(view)
  // First the observations and the labels on screen
  await fetchObservationsAndLabels(view)
  // Later all labels from shacl
  // @TODO move this to a Web worker
  fetchShaclLabels(view)
}

onMounted(() => initView(props.view))
watch(() => props.view, () => initView(props.view))

function updateDataset (arg) {
  emit('updateDataset', arg)
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
  page.value = 1
  updateObservations()
}

// Filters

const filtersSummary = computed(() => {
  return filters.value.map((currElement, index) => {
    const {
      dimension,
      operation,
      arg
    } = currElement
    const dimensionLabel = dimension.out(ns.schema.name, { language: langStore.language }).value
    const valueLabel = langStore.getDisplayString(langStore.getDisplayTerm(arg))
    return {
      dimension: dimension.path,
      index,
      label: `${dimensionLabel} ${operation.label} ${valueLabel}`
    }
  })
})

function removeFilter ({
  dimensionPath,
  index
}) {
  filters.value.splice(index, 1)
  page.value = 1
  updateObservations()
}

function updateFilters(){
  page.value = 1
  updateObservations()
}

// Computed and helpers
function isNumericScale (dimension) {
  const scaleType = dimension.ptr.out(ns.qudt.scaleType).term
  return ns.qudt.RatioScale.equals(scaleType) || ns.qudt.IntervalScale.equals(scaleType)
}

function isMeasureDimension (dimension) {
  return !!dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term
}

function filterDuplicates (dimensions) {
  const set = rdf.termSet()
  return dimensions.filter(x => {
    const result = !set.has(x.ptr.term)
    set.add(x.ptr.term)
    return result
  })
}

const cubeDimensions = computed(() => {
  if (!currentView.value) {
    return undefined
  }
  const dimensions = currentView.value.dimensions.map(dimension => dimension.cubeDimensions[0])
    .filter(notNull => notNull)
  return filterDuplicates(dimensions)
})

// Expose

defineExpose({
  currentView
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
              :dimension="dimension"
              :language="language"
              :sort-dimension="sortDimension"
              :sort-direction="sortDirection"
              @updateSort="updateSort"
              @updateFilters="updateFilters"
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
        <tbody v-else :key="`${debugCounter}/observations`">
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
              :pointer="pointer"
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
        :key="`${debugCounter}/debug`"
        v-if="debugOpen===true"
        :debugView="currentView"
        @updateDataset="updateDataset"
      />
    </div>
  </div>
</template>
