<template>
  <div v-if="cubes.isLoading" class="p-2 flex items-center gap-2">
    <loading-icon />
    Loading cubes...
  </div>
  <select v-else :value="cube?.term.value" @change="onSelect">
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
    cube: Cube,
  },
  emits: ['select'],

  setup (props) {
    const { source } = toRefs(props)
    const cubes = ref(Remote.loading())
    const fetchCubes = async () => {
      const cubesData = await source.value.cubes({
        filters: [
          Cube.filter.noValidThrough(),
        ],
      })
      cubes.value = Remote.loaded(cubesData)
    }
    onMounted(fetchCubes)
    watch(source, fetchCubes)

    return {
      cubes,
    }
  },

  methods: {
    onSelect (event) {
      const cubeURI = event.target.value

      if (!cubeURI || cubeURI === this.cube?.term.value) return

      const cube = this.cubes.data.find(({ term }) => term.value === cubeURI)
      this.$emit('select', cube)
    },
  },
})
</script>
