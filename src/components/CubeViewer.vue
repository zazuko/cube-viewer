<template>
  <div class="p-4">
    <h1 class="font-bold">
      <span v-if="title">{{ title }}</span>
      <span v-else class="text-gray-500">Untitled</span>
    </h1>
    <span class="text-sm">{{ cube.term.value }}</span>

    <table>
      <thead>
        <tr>
          <th v-for="dimension in cube.dimensions" :key="dimension.ptr.term.value">
            <dimension-header :dimension="dimension" :language="language" />
          </th>
        </tr>
      </thead>
      <tbody v-if="observations.isLoading">
        <tr>
          <td :colspan="cube.dimensions.length">
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
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { CubeSource, Source, View } from 'rdf-cube-view-query'
import { Cube } from 'rdf-cube-view-query/lib/Cube'
import DimensionHeader from './DimensionHeader.vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import ObservationValue from './ObservationValue.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'

const language = ['en', 'de', '*']

export default defineComponent({
  name: 'CubeViewer',
  components: { DimensionHeader, LoadingIcon, ObservationValue },
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
    const cubeSource = computed(() => CubeSource.fromSource(source.value, cube.value))
    const cubeView = computed(() => {
      const pageSize = 10
      const offset = 0
      const view = View.fromCube(cube.value)

      view.ptr.addOut(ns.view.projection, projection => {
        const order = projection.blankNode()
          .addOut(ns.view.dimension, view.dimensions[0].ptr)
          .addOut(ns.view.direction, ns.view.Ascending)

        projection.addList(ns.view.orderBy, order)
        projection.addOut(ns.view.limit, pageSize)
        projection.addOut(ns.view.offset, offset)
      })

      return view
    })

    const observations = ref(Remote.loading())
    const fetchObservations = async () => {
      const observationsData = await cubeView.value.observations()
      console.log(observationsData)
      observations.value = Remote.loaded(observationsData)
    }
    onMounted(fetchObservations)
    watch(cubeView, fetchObservations)

    return {
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
