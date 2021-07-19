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

      <table>
        <thead>
          <tr class="h-1">
            <dimension-header
              v-for="dimension in cube.data.dimensions"
              :key="dimension.ptr.term.value"
              :dimension="dimension"
              :language="displayLanguage"
              :sort-dimension="sortDimension"
              :sort-direction="sortDirection"
              :filters="filters.get(dimension.path.value)"
              @updateSort="updateSort"
              @update:filters="updateDimensionFilters"
              class="px-2 py-1 border border-b-2 align-top text-left"
            />
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
              <observation-value :value="observation[dimension.path.value]" :cube="cube.data" />
            </td>
          </tr>
        </tbody>
      </table>

      <pagination-menu
        v-model:page="page"
        v-model:pageSize="pageSize"
      />
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { InformationCircleIcon, XCircleIcon } from '@heroicons/vue/outline'
import { CubeSource, Filter, Source, View } from 'rdf-cube-view-query'
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

    const cube = ref(Remote.loading())
    const fetchCube = async () => {
      cube.value = Remote.loading()

      try {
        const cubeData = await source.value.cube(cubeUri.value)
        if (cubeData) {
          cube.value = Remote.loaded(cubeData)
        } else {
          cube.value = Remote.error(`Could not find cube ${cubeUri.value}`)
        }
      } catch (e) {
        cube.value = Remote.error(e)
      }
    }
    onMounted(fetchCube)
    watch(cubeUri, fetchCube)

    const page = ref(1)
    const pageSize = ref(defaultPageSize)

    const sortDimension = ref(null)
    const sortDirection = ref(ns.view.Ascending)

    const filters = ref(new Map())
    const initFilters = () => {
      if (cube.value.data) {
        filters.value = new Map(cube.value.data.dimensions.map(dimension => [dimension.path.value, []]))
      }
    }
    initFilters()
    watch(cube, initFilters)

    const cubeSource = computed(() => {
      if (cube.value.data) {
        return CubeSource.fromSource(source.value, cube.value.data)
      } else {
        return null
      }
    })
    const cubeView = computed(() => {
      if (!cube.value.data) return null

      const view = View.fromCube(cube.value.data)

      // Add view sorting and pagination
      view.ptr.addOut(ns.view.projection, projection => {
        const offset = (page.value - 1) * pageSize.value

        projection.addOut(ns.view.limit, pageSize.value)
        projection.addOut(ns.view.offset, offset)

        if (sortDimension.value) {
          // Passing `path` because there's a bug in the library that doesn't
          // handle dimension comparison properly
          const orderDimension = view.dimension({ cubeDimension: sortDimension.value.path })
          const order = projection.blankNode()
            .addOut(ns.view.dimension, orderDimension.ptr)
            .addOut(ns.view.direction, sortDirection.value)

          projection.addList(ns.view.orderBy, order)
        }
      })

      // Add view filters
      const viewFilters = [...filters.value.entries()].map(([dimensionPath, dimensionFilters]) =>
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
    })

    const observations = ref(Remote.loading())
    const fetchObservations = async () => {
      observations.value = Remote.loading()

      try {
        const observationsData = await cubeView.value.observations()
        observations.value = Remote.loaded(observationsData)
      } catch (e) {
        observations.value = Remote.error(e)
      }
    }
    onMounted(fetchObservations)
    watch(cubeView, fetchObservations)

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
      isCubeMetadataOpen,
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
      return [...this.filters.entries()].flatMap(([dimensionPath, dimensionFilters]) =>
        dimensionFilters.map(({ dimension, operation, arg }, index) => {
          const dimensionLabel = dimension.out(ns.schema.name, { language: this.displayLanguage }).value

          return {
            dimensionPath,
            index,
            label: `${dimensionLabel} ${operation.label} ${ns.shrink(arg.value, this.cube.data.term.value)}`,
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
    },

    removeFilter ({ dimensionPath, index }) {
      this.filters.get(dimensionPath).splice(index, 1)
    },
  },
})
</script>
