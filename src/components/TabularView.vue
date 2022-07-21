<template>
  <!-- h-1 is a hack to make the header cells layout work -->
  <table class="h-1">
    <thead>
    <tr>
      <th v-for="dimension in cube.dimensions" :key="dimension.ptr.term.value"
          class="border border-b-2 align-top text-left h-full">
        <dimension-header
          :cube="cube"
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
      <td :colspan="cube.dimensions.length" class="border px-2 py-2">
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
      <td :colspan="cube.dimensions.length" class="border px-2 py-2">
        <loading-icon/>
      </td>
    </tr>
    </tbody>
    <tbody v-else-if="observations.error">
    <tr>
      <td :colspan="cube.dimensions.length" class="border px-2 py-1">
        {{ observations.error }}
      </td>
    </tr>
    </tbody>
    <tbody v-else>
    <tr v-for="(observation, index) in observations.data" :key="index">
      <td
        v-for="dimension in cube.dimensions"
        :key="dimension.ptr.term.value"
        class="border px-2 py-1 whitespace-nowrap"
        :class="{
                'text-right tabular-nums': isNumericScale(dimension),
                'bg-primary-50': isMeasureDimension(dimension),
              }"
      >
        <observation-value
          :value="observation[dimension.path.value]"
          :cube="cube"
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
</template>

<script>
/* eslint-disable */
import { defineComponent, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import { XCircleIcon } from '@heroicons/vue/outline'
import queue from 'promise-the-world/queue.js'
import { Filter, LookupSource, View } from 'rdf-cube-view-query'
import RDF from 'rdf-ext'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import { viewFromCube } from './common/viewFromCube.js'

const defaultPageSize = 10

export default defineComponent({
  name: 'TabularView',
  components: {
    DimensionHeader,
    LoadingIcon,
    ObservationValue,
    PaginationMenu,
    XCircleIcon
  },
  props: {
    cube: {
      type: Object,
      required: true
    },
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
      view,
      cube
    } = toRefs(props)

    // Populate some filters
    const filters = ref(new Map())
    cube.value.dimensions.forEach(d => filters.value.set(d.path.value, []))

    // This needs to come from the view
    const page = ref(1)
    const pageSize = ref(defaultPageSize)
    const sortDimension = shallowRef(null)
    const sortDirection = shallowRef(ns.view.Ascending)

    const observations = ref(Remote.loading())
    const observationCount = ref(Remote.loading())

    const queryQueue = queue(1)

    function getCurrentView () {
      if (view.value) {
        view.value.clear()
      }
      const result = viewFromCube({ cube: cube.value }, {
        page: page.value,
        pageSize: pageSize.value,
        sortDimension: sortDimension.value,
        sortDirection: sortDirection.value
      })

      // Add view filters
      const viewFilters = [...view.value.filters.entries()].map(([dimensionPath, dimensionFilters]) =>
        dimensionFilters.map(({
          operation,
          arg
        }) => {
          const viewDimension = result.dimension({ cubeDimension: dimensionPath })

          return new Filter({
            dimension: viewDimension,
            operation: operation.term,
            arg
          })
        }))

      for (const filter of viewFilters) {
        result.addFilter(filter)
      }
      return result
    }

    const updateObservations = async () => {
      const currentView = getCurrentView()
      await fetchObservations(currentView)
    }
    watch([cube, page, pageSize, sortDimension, sortDirection, filters], updateObservations)

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
    const fetchLabels = async () => {
      labels.value = {}

      if (!view.value || !view.value) return

      const dimensions = view.value.dimensions

      const dimensionsWithLabels = await Promise.all(dimensions.map(dimension => {
        return queryQueue.add(async () => fetchDimensionLabels(dimension, view.value))
      }))

      labels.value = dimensionsWithLabels.reduce(
        (acc, [dimensionPath, dimensionLabels]) => ({
          ...acc,
          [dimensionPath.value]: dimensionLabels
        }),
        {}
      )
    }
    onMounted(fetchLabels)
    watch(view, fetchLabels)

    return {
      page,
      pageSize,
      sortDimension,
      sortDirection,
      filters,
      observations,
      observationCount,
      labels,
      updateObservations
    }
  },

  computed: {

    filtersSummary () {
      const language = this.language
      const cube = this.view

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
            cube.ptr.node(arg).out(ns.schema.name, { language }).value ||
            ns.shrink(arg.value, this.view.term.value)
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

    updateDimensionFilters (dimension, filters) {
      this.filters.set(dimension.path.value, filters)
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

  const dimensionLabels = RDF.clownface({ dataset: RDF.dataset() })

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
</script>
