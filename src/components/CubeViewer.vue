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
          <th v-for="dimension in cube.dimensions" :key="dimension.ptr.term.value">
            <dimension-header :dimension="dimension" :language="language" />
          </th>
        </tr>
      </thead>
      <tbody v-if="observations.isLoading">
        <tr v-for="i in Array(pageSize)" :key="i">
          <td :colspan="cube.dimensions.length" class="border px-4 py-2">
            <loading-icon />
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="(observation, index) in observations.data" :key="index">
          <td v-for="dimension in cube.dimensions" :key="dimension.ptr.term.value" class="border px-4 py-2">
            <observation-value :value="observation[dimension.path.value]" :dimension="dimension" />
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

    const { source, cube } = toRefs(props)
    const cubeSource = computed(() => CubeSource.fromSource(source.value, cube.value))
    const cubeView = computed(() => {
      const view = View.fromCube(cube.value)

      view.ptr.addOut(ns.view.projection, projection => {
        const offset = (page.value - 1) * pageSize.value
        const order = projection.blankNode()
          .addOut(ns.view.dimension, view.dimensions[0].ptr)
          .addOut(ns.view.direction, ns.view.Ascending)

        projection.addList(ns.view.orderBy, order)
        projection.addOut(ns.view.limit, pageSize.value)
        projection.addOut(ns.view.offset, offset)
      })

      return view
    })

    const observations = ref(Remote.loading())
    const fetchObservations = async () => {
      observations.value = Remote.loading()

      const observationsData = await cubeView.value.observations()
      console.log(observationsData)
      observations.value = Remote.loaded(observationsData)
    }
    onMounted(fetchObservations)
    watch(cubeView, fetchObservations)

    return {
      page,
      pageSize,
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
})
</script>
