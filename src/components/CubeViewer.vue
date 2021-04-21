<template>
  <div class="p-4 flex flex-col gap-4">
    <header>
      <h1 class="font-bold">
        <span v-if="title">{{ title }}</span>
        <span v-else class="text-gray-500">Untitled</span>
      </h1>
      <span class="text-sm">{{ cube.term.value }}</span>
    </header>

    <table>
      <thead>
        <tr>
          <dimension-header
            v-for="dimension in cube.dimensions"
            :key="dimension.ptr.term.value"
            :dimension="dimension"
            :language="language"
            :sort-dimension="sortDimension"
            :sort-direction="sortDirection"
            :filters="filters.get(dimension.path.value)"
            @updateSort="updateSort"
            @update:filters="updateDimensionFilters"
            class="px-2 py-1 border border-b-2 align-top text-left"
          />
        </tr>
        <tr v-show="filtersSummary.length > 0">
          <td :colspan="cube.dimensions.length" class="border px-2 py-2">
            <div class="flex gap-2 justify-start">
              <span v-for="(filter, index) in filtersSummary" :key="index" class="tag bg-gray-100 rounded-md flex items-center gap-1">
                <span>{{ filter.label }}</span>
                <button title="Remove filter" @click="removeFilter(filter)"><x-circle-icon /></button>
              </span>
            </div>
          </td>
        </tr>
      </thead>
      <tbody v-if="observations.isLoading">
        <tr v-for="i in Array(pageSize)" :key="i">
          <td :colspan="cube.dimensions.length" class="border px-2 py-2">
            <loading-icon />
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
            class="border px-2 py-1"
            :class="{ 'text-right tabular-nums': isNumericScale(dimension) }"
          >
            <observation-value :value="observation[dimension.path.value]" :cube="cube" />
          </td>
        </tr>
      </tbody>
    </table>

    <pagination-menu
      v-model:page="page"
      v-model:pageSize="pageSize"
    />
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { CubeSource, Filter, Source, View } from 'rdf-cube-view-query'
import { Cube } from 'rdf-cube-view-query/lib/Cube'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'
import XCircleIcon from './icons/XCircleIcon.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'

const language = ['en', 'de', '*']
const defaultPageSize = 10

export default defineComponent({
  name: 'CubeViewer',
  components: { DimensionHeader, LoadingIcon, ObservationValue, PaginationMenu, XCircleIcon },
  props: {
    source: {
      type: Source,
      required: true,
    },
    cube: {
      type: Cube,
      required: true,
    },
  },

  setup (props) {
    const { source, cube } = toRefs(props)

    const page = ref(1)
    const pageSize = ref(defaultPageSize)

    const sortDimension = ref(null)
    const sortDirection = ref(ns.view.Ascending)

    const filters = ref(new Map(cube.value.dimensions.map(dimension => [dimension.path.value, []])))

    const cubeSource = computed(() => CubeSource.fromSource(source.value, cube.value))
    const cubeView = computed(() => {
      const view = View.fromCube(cube.value)

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

    return {
      page,
      pageSize,
      sortDimension,
      sortDirection,
      filters,
      cubeSource,
      cubeView,
      language,
      observations,
    }
  },

  computed: {
    title () {
      const title = this.cube.out(ns.schema.name, { language: this.language }).value
      return title ?? null
    },

    filtersSummary () {
      return [...this.filters.entries()].flatMap(([dimensionPath, dimensionFilters]) =>
        dimensionFilters.map(({ dimension, operation, arg }, index) => {
          const dimensionLabel = dimension.out(ns.schema.name, { language: this.language }).value

          return {
            dimensionPath,
            index,
            label: `${dimensionLabel} ${operation.label} ${arg.value}`,
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
