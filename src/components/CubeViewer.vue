<template>
  <div class="p-4">
    <div v-if="cube.isLoading">
      <loading-icon />
    </div>
    <div v-else-if="cube.error" class="text-red-500">
      {{ cube.error }}
    </div>
    <div class="flex flex-col gap-4" v-else>
      <header>
        <h1 class="font-bold mb-2" :title="cube.data.term.value">
          <span v-if="title">{{ title }}</span>
          <span v-else class="text-gray-500">Untitled</span>
        </h1>
        <section v-if="description" class="text-sm text-gray-700">
          {{ description }}
        </section>
        <div>
          <button @click="isCubeMetadataOpen = true" title="Cube Metadata">
            <information-circle-icon class="text-gray-500 w-5 h-5" />
          </button>
          <resource-details-dialog
            title="Cube Metadata"
            :resource="cube.data.ptr"
            :is-open="isCubeMetadataOpen"
            @close="isCubeMetadataOpen = false"
          />
        </div>
      </header>

      <!-- h-1 is a hack to make the header cells layout work -->
      <table class="h-1">
        <thead>
          <tr>
            <th v-for="dimension in cube.data.dimensions" :key="dimension.ptr.term.value" class="border border-b-2 align-top text-left h-full">
              <dimension-header
                :cube="cube.data"
                :dimension="dimension"
                :language="displayLanguage"
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
            <td :colspan="cube.data.dimensions.length" class="border px-2 py-2">
              <div class="flex gap-2 justify-start">
                <span v-for="(filter, index) in filtersSummary" :key="index" class="tag bg-gray-100 rounded-md flex items-center gap-1">
                  <span>{{ filter.label }}</span>
                  <button title="Remove filter" @click="removeFilter(filter)" class="button-text">
                    <x-circle-icon class="w-5 h-5" />
                  </button>
                </span>
              </div>
            </td>
          </tr>
        </thead>
        <tbody v-if="observations.isLoading">
          <tr v-for="i in Array(pageSize)" :key="i">
            <td :colspan="cube.data.dimensions.length" class="border px-2 py-2">
              <loading-icon />
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="observations.error">
          <tr>
            <td :colspan="cube.data.dimensions.length" class="border px-2 py-1">
              {{ observations.error }}
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="(observation, index) in observations.data" :key="index">
            <td
              v-for="dimension in cube.data.dimensions"
              :key="dimension.ptr.term.value"
              class="border px-2 py-1 whitespace-nowrap"
              :class="{
                'text-right tabular-nums': isNumericScale(dimension),
                'bg-primary-50': isMeasureDimension(dimension),
              }"
            >
              <observation-value
                :value="observation[dimension.path.value]"
                :cube="cube.data"
                :labels="labels[dimension.path.value]"
                :language="displayLanguage"
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
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import { InformationCircleIcon, XCircleIcon } from '@heroicons/vue/outline'
import { CubeSource, Filter, LookupSource, Source, View } from 'rdf-cube-view-query'
import RDF from 'rdf-ext'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'

const defaultLanguage = '*'
const defaultPageSize = 10

export default defineComponent({
  name: 'CubeViewer',
  components: {
    DimensionHeader,
    InformationCircleIcon,
    LoadingIcon,
    ObservationValue,
    PaginationMenu,
    ResourceDetailsDialog,
    XCircleIcon,
  },
  props: {
    source: {
      type: Source,
      required: true,
    },
    cubeUri: {
      type: String,
      required: true,
    },
    language: {
      type: [String, Array],
      required: false,
    },
  },

  setup (props) {
    const { source, cubeUri } = toRefs(props)

    const cube = shallowRef(Remote.loading())
    const cubeSource = shallowRef(null)

    const filters = ref(new Map())

    const page = ref(1)
    const pageSize = ref(defaultPageSize)

    const sortDimension = shallowRef(null)
    const sortDirection = shallowRef(ns.view.Ascending)

    const observations = ref(Remote.loading())
    const observationCount = ref(Remote.loading())

    const fetchCube = async () => {
      cube.value = Remote.loading()
      cubeSource.value = null
      filters.value = new Map()
      labels.value = {}
      observations.value = Remote.loading()
      observationCount.value = Remote.loading()

      try {
        const cubeData = await source.value.cube(cubeUri.value)
        if (cubeData) {
          cube.value = Remote.loaded(cubeData)
          cubeSource.value = CubeSource.fromSource(source.value, cubeData)
          filters.value = new Map(cubeData.dimensions.map(dimension => [dimension.path.value, []]))
        } else {
          cube.value = Remote.error(`Could not find cube ${cubeUri.value}`)
        }
      } catch (e) {
        console.error(e)
        cube.value = Remote.error(e)
      }
    }
    onMounted(fetchCube)
    watch(cubeUri, fetchCube)

    const cubeView = shallowRef(null)
    const prepareCubeView = () => {
      if (!cube.value.data) return

      cubeView.value = makeCubeView(
        cube.value.data,
        page.value,
        pageSize.value,
        filters.value,
        sortDimension.value,
        sortDirection.value
      )
    }
    watch([cube, page, pageSize, sortDimension, sortDirection, filters], prepareCubeView)

    const fetchObservations = async () => {
      observations.value = Remote.loading()

      if (!cubeView.value) return

      const [observationsResult, observationCountResult] = await Promise.all([
        Remote.fetch(cubeView.value.observations.bind(cubeView.value)),
        Remote.fetch(cubeView.value.observationCount.bind(cubeView.value)),
      ])
      observations.value = observationsResult
      observationCount.value = observationCountResult
    }
    onMounted(fetchObservations)
    watch(cubeView, fetchObservations)

    // Labels are stored as Record<dimensionURI, Clownface>
    const labels = ref({})
    const fetchLabels = async () => {
      labels.value = {}

      if (!cubeView.value || !cubeSource.value) return

      const dimensions = cubeView.value.dimensions
      const dimensionsWithLabels = await Promise.all(dimensions.map(dimension =>
        fetchDimensionLabels(dimension, cubeSource.value)))

      labels.value = dimensionsWithLabels.reduce(
        (acc, [dimensionPath, dimensionLabels]) => ({ ...acc, [dimensionPath.value]: dimensionLabels }),
        {}
      )
    }
    watch(cubeView, fetchLabels)

    const isCubeMetadataOpen = ref(false)

    return {
      cube,
      page,
      pageSize,
      sortDimension,
      sortDirection,
      filters,
      cubeSource,
      cubeView,
      observations,
      observationCount,
      isCubeMetadataOpen,
      labels,
      prepareCubeView,
    }
  },

  computed: {
    displayLanguage () {
      return this.language ?? defaultLanguage
    },

    title () {
      const title = this.cube.data.out(ns.schema.name, { language: this.displayLanguage }).value
      return title ?? null
    },

    description () {
      const description = this.cube.data.out(ns.schema.description, { language: this.displayLanguage }).value
      return description ?? null
    },

    filtersSummary () {
      const language = this.displayLanguage
      const cube = this.cube.data

      return [...this.filters.entries()].flatMap(([dimensionPath, dimensionFilters]) =>
        dimensionFilters.map(({ dimension, operation, arg }, index) => {
          const dimensionLabel = dimension.out(ns.schema.name, { language }).value
          const dimensionValueLabels = this.labels[dimension.path.value]
          const valueLabel = (
            dimensionValueLabels?.node(arg).out(ns.schema.name, { language }).value ||
            cube.ptr.node(arg).out(ns.schema.name, { language }).value ||
            ns.shrink(arg.value, this.cube.data.term.value)
          )

          return {
            dimensionPath,
            index,
            label: `${dimensionLabel} ${operation.label} ${valueLabel}`,
          }
        })
      )
    },
  },

  methods: {
    isNumericScale (dimension) {
      const scaleType = dimension.out(ns.qudt.scaleType).term

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
      this.prepareCubeView()
    },

    removeFilter ({ dimensionPath, index }) {
      this.filters.get(dimensionPath).splice(index, 1)
      this.prepareCubeView()
    },
  },
})

function makeCubeView (cube, page, pageSize, filters, sortDimension, sortDirection) {
  const view = View.fromCube(cube)

  // Add view sorting and pagination
  view.ptr.addOut(ns.view.projection, projection => {
    const offset = (page - 1) * pageSize

    projection.addOut(ns.view.limit, pageSize)
    projection.addOut(ns.view.offset, offset)

    if (sortDimension) {
      // Passing `path` because there's a bug in the library that doesn't
      // handle dimension comparison properly
      const orderDimension = view.dimension({ cubeDimension: sortDimension.path })
      const order = projection.blankNode()
        .addOut(ns.view.dimension, orderDimension.ptr)
        .addOut(ns.view.direction, sortDirection)

      projection.addList(ns.view.orderBy, order)
    }
  })

  // Add view filters
  const viewFilters = [...filters.entries()].map(([dimensionPath, dimensionFilters]) =>
    dimensionFilters.map(({ operation, arg }) => {
      const viewDimension = view.dimension({ cubeDimension: dimensionPath })

      return new Filter({
        dimension: viewDimension,
        operation: operation.term,
        arg,
      })
    }))

  for (const filter of viewFilters) {
    view.addFilter(filter)
  }

  return view
}

const fetchDimensionLabels = async (dimension, cubeSource) => {
  const cubeDimension = dimension.cubeDimensions[0]
  const path = cubeDimension.path

  const dimensionLabels = RDF.clownface({ dataset: RDF.dataset() })

  if (ns.sh.IRI.equals(cubeDimension.out(ns.sh.nodeKind).term)) {
    const view = new View({ parent: cubeSource })
    const source = LookupSource.fromSource(cubeSource)
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
</script>
