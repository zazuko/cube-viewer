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
            @updateSort="updateSort"
            class="px-2 py-1 border border-b-2 align-top text-left"
          />
        </tr>
      </thead>
      <tbody v-if="observations.isLoading">
        <tr v-for="i in Array(pageSize)" :key="i">
          <td :colspan="cube.dimensions.length" class="border px-2 py-1">
            <loading-icon />
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
            <observation-value :value="observation[dimension.path.value]" :dimension="dimension" :cube="cube" />
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
import { CubeSource, Source, View } from 'rdf-cube-view-query'
import { Cube } from 'rdf-cube-view-query/lib/Cube'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import PaginationMenu from './PaginationMenu.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'

const language = ['en', 'de', '*']
const defaultPageSize = 10

export default defineComponent({
  name: 'CubeViewer',
  components: { DimensionHeader, LoadingIcon, ObservationValue, PaginationMenu },
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
    const page = ref(1)
    const pageSize = ref(defaultPageSize)

    const sortDimension = ref(null)
    const sortDirection = ref(ns.view.Ascending)

    const { source, cube } = toRefs(props)
    const cubeSource = computed(() => CubeSource.fromSource(source.value, cube.value))
    const cubeView = computed(() => {
      const view = View.fromCube(cube.value)

      view.ptr.addOut(ns.view.projection, projection => {
        const offset = (page.value - 1) * pageSize.value

        projection.addOut(ns.view.limit, pageSize.value)
        projection.addOut(ns.view.offset, offset)

        if (sortDimension.value) {
          // TODO: `view.dimension` is buggy so I rewrote it below
          // const orderDimension = view.dimension({ cubeDimension: sortDimension.value })
          const orderDimension = view.dimensions.find((dimension) =>
            dimension.cubeDimensions.some(cubeDimension => cubeDimension.path.equals(sortDimension.value.path)))

          const order = projection.blankNode()
            .addOut(ns.view.dimension, orderDimension.ptr)
            .addOut(ns.view.direction, sortDirection.value)
          projection.addList(ns.view.orderBy, order)
        }
      })

      return view
    })

    const observations = ref(Remote.loading())
    const fetchObservations = async () => {
      observations.value = Remote.loading()

      const observationsData = await cubeView.value.observations()
      observations.value = Remote.loaded(observationsData)
    }
    onMounted(fetchObservations)
    watch(cubeView, fetchObservations)

    return {
      page,
      pageSize,
      sortDimension,
      sortDirection,
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
  },
})
</script>
