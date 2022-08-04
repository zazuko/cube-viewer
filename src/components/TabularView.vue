<template>
  <!-- h-1 is a hack to make the header cells layout work -->
  <table class="h-1">
    <thead>
    <tr>
      <th v-for="dimension in cubeDimensions" :key="dimension.ptr.term.value"
          class="border border-b-2 align-top text-left h-full">
        <dimension-header
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
          :clownface="data"
          :labels="labels[dimension.path.value]"
          :language="language"
        />
      </td>
    </tr>
    </tbody>
  </table>

  <pagination-menu
    v-model:page="page"
    v-model:pageSize="pageSize"
    :items-count="observationCount"
  />
  <Editbox
    format="text/turtle"
    ref="resultBoxRef"
    :quads="viewQuads"
    readOnly="false"
    has-toggle="true"
    title="View"
  />
</template>

<script>

/* eslint-disable */
import Editbox from './rdf/Editbox.vue'
import { XCircleIcon } from '@heroicons/vue/outline'
import queue from 'promise-the-world/queue.js'
import { LookupSource, View } from 'rdf-cube-view-query'
import rdf from 'rdf-ext'
import { defineComponent, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import { projectionFromView, updateViewProjection } from './common/viewUtils.js'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'

export default defineComponent({
  name: 'TabularView',
  components: {
    DimensionHeader,
    LoadingIcon,
    ObservationValue,
    PaginationMenu,
    XCircleIcon,
    Editbox,
  },
  props: {
    view: {
      type: Object,
      required: true
    },
    language: {
      type: [String, Array],
      required: true
    }
  },

  setup (props) {
    const {
      view
    } = toRefs(props)

    // Get all the controls from the view
    const projection = projectionFromView(view.value)
    const filters = ref(projection.filters)
    const page = ref(projection.page)
    const pageSize = ref(projection.pageSize)
    const sortDimension = shallowRef(projection.sortDimension)
    const sortDirection = shallowRef(projection.sortDirection)
    const observations = ref(Remote.loading())
    const observationCount = ref(Remote.loading())
    const queryQueue = queue(1)

    function getCurrentView () {
      return updateViewProjection({
        view: view.value,
        controls: {
          page: page.value,
          pageSize: pageSize.value,
          sortDimension: sortDimension.value,
          sortDirection: sortDirection.value,
          filters: filters.value
        }
      })
    }

    const currentView = ref(view.value)
    const viewQuads = ref(viewToQuads(currentView.value))

    const updateObservations = async () => {
      currentView.value = getCurrentView()
      viewQuads.value = viewToQuads(currentView.value)
      await fetchObservations(currentView.value)
    }
    watch([page, pageSize, sortDimension, sortDirection, filters], updateObservations)

    const fetchObservations = async (currentView) => {

      observations.value = Remote.loading()

      if (!currentView) return

      await queryQueue.add(async () => {
        observations.value = await Remote.fetch(currentView.observations.bind(currentView))
      })

      await queryQueue.add(async () => {
        observationCount.value = await Remote.fetch(currentView.observationCount.bind(currentView))
      })
    }
    onMounted(() => fetchObservations(view.value))
    watch(view, () => fetchObservations(view.value))

    // Labels are stored as Record<dimensionURI, Clownface>
    const labels = ref({})
    const fetchLabels = async (currentView) => {

      if (!currentView || !currentView) return

      const dimensions = currentView.dimensions

      const dimensionsWithLabels = await Promise.all(dimensions.map(dimension => {
        return queryQueue.add(async () => fetchDimensionLabels(dimension, currentView))
      }))

      return dimensionsWithLabels.reduce(
        (acc, [dimensionPath, dimensionLabels]) => ({
          ...acc,
          [dimensionPath.value]: dimensionLabels
        }),
        {}
      )
    }

    onMounted(() => labels.value = fetchLabels(view.value))
    watch(view, () => labels.value = fetchLabels(view.value))

    const cubeDimensions = view.value.dimensions.map(dimension => dimension.cubeDimensions[0])
    const data = view.value.ptr.node(view.value.dimensions[0].cube)

    return {
      page,
      pageSize,
      sortDimension,
      sortDirection,
      filters,
      observations,
      observationCount,
      labels,
      updateObservations,
      viewQuads,
      cubeDimensions,
      data
    }
  },

  computed: {

    filtersSummary () {
      const language = this.language
      const ptr = this.view.ptr
      const cube = this.view.dimensions[0].cube

      return [...this.filters.entries()].flatMap(([dimensionPath, dimensionFilters]) =>
        dimensionFilters.map(({
          dimension,
          operation,
          arg
        }, index) => {

          const dimensionLabel = dimension.out(ns.schema.name, { language }).value
          const dimensionValueLabels = this.labels[dimension.path.value]
          const valueLabel = (
            dimensionValueLabels?.node(arg).out(ns.schema.name, { language }).value ||
            ptr.node(arg).out(ns.schema.name, { language }).value ||
            ns.shrink(arg.value, cube.value)
          )

          return {
            dimensionPath,
            index,
            label: `${dimensionLabel} ${operation.label} ${valueLabel}`
          }
        })
      )
    }
  },

  methods: {
    isNumericScale (dimension) {
      const scaleType = dimension.ptr.out(ns.qudt.scaleType).term
      return ns.qudt.RatioScale.equals(scaleType) || ns.qudt.IntervalScale.equals(scaleType)
    },

    isMeasureDimension (dimension) {
      return !!dimension.ptr.has(ns.rdf.type, ns.cube.MeasureDimension).term
    },

    updateSort (dimension, direction) {
      this.sortDimension = dimension
      this.sortDirection = direction
    },

    updateDimensionFilters (cubeDimension, filters) {
      this.filters.set(cubeDimension.path.value, filters)
      this.updateObservations()
    },

    removeFilter ({
      dimensionPath,
      index
    }) {
      this.filters.get(dimensionPath).splice(index, 1)
      this.updateObservations()
    }
  }
})

const fetchDimensionLabels = async (dimension, cubeSource) => {

  const cubeDimension = dimension.cubeDimensions[0]
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
      as: ns.schema.name
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


function viewToQuads(view) {
  const { dataset } = getBoundedDescription({
    term: view.term,
    dataset: view.dataset
  })
  return [...dataset]
}

function viewToN3(view) {
  const { dataset } = getBoundedDescription({
    term: view.term,
    dataset: view.dataset
  })
  return dataset.toString()
}

function getBoundedDescription ({
  term,
  dataset
}) {
  const descriptionWithBlankNodes = rdf.traverser(({
    dataset,
    level,
    quad
  }) => level === 0 || (quad.subject.termType === 'BlankNode' && level <5))
  const result = rdf.dataset()
  result.addAll(descriptionWithBlankNodes.match({
    term,
    dataset
  }))
  return {
    term,
    dataset: result
  }
}

</script>
