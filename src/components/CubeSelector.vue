<template>
  <div v-if="cubes.isLoading" class="p-2 flex items-center gap-2">
    <loading-icon />
    Loading cubes...
  </div>
  <div v-else-if="cubes.error" class="p-2 text-red-500">
    {{ cubes.error }}
  </div>
  <select v-else :value="cubeUri" @change="onSelect">
<!--    <option>Select cube</option>-->
    <option v-for="cube in cubes.data" :key="cube.term.value" :value="cube.term.value">
      {{ cube.term.value }}
    </option>
  </select>
</template>

<script>
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { Cube, Source } from 'rdf-cube-view-query'
import LoadingIcon from './icons/LoadingIcon.vue'
import * as Remote from '../remote'

export default defineComponent({
  name: 'CubeSelector',
  components: { LoadingIcon },
  props: {
    source: {
      type: Source,
      required: true,
    },
    cubeUri: String,
  },
  emits: ['select'],

  setup (props) {
    const { source } = toRefs(props)
    const cubes = ref(Remote.loading())
    const fetchCubes = async () => {
      cubes.value = Remote.loading()
      cubes.value = await Remote.fetch(async () => source.value.cubes({
        noShape: true,
        filters: [
          Cube.filter.noValidThrough(),
          Cube.filter.noExpires(),
        ],
      }))
    }
    onMounted(fetchCubes)
    watch(source, fetchCubes)

    return {
      cubes,
    }
  },

  methods: {
    onSelect (event) {
      this.$emit('select', event.target.value)
    },
  },
})
</script>
