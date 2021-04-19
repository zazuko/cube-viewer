<template>
  <div>
    <cube-selector :source="source" :cube="cube" @select="selectCube" />
    <cube-viewer v-if="cube" :source="source" :cube="cube" />
  </div>
</template>

<script>
import CubeSelector from './components/CubeSelector.vue'
import CubeViewer from './components/CubeViewer.vue'
import { Source } from 'rdf-cube-view-query'

export default {
  name: 'App',
  components: { CubeSelector, CubeViewer },

  data () {
    return {
      sourceOptions: {
        endpointUrl: 'https://test.lindas.admin.ch/query/',
      },
      cube: null,
    }
  },

  computed: {
    source () {
      return new Source(this.sourceOptions)
    },
  },

  methods: {
    selectCube (cube) {
      this.cube = cube
    },
  },
}
</script>
