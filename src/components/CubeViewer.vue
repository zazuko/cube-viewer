<template>
  <div>
    {{ cube.term.value }}
  </div>
</template>

<script>
import { computed, toRefs } from 'vue'
import { Source } from 'rdf-cube-view-query'
import { Cube, CubeSource } from 'rdf-cube-view-query/lib/Cube'

export default {
  name: 'CubeViewer',
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

    return {
      cubeSource,
    }
  },
}
</script>
