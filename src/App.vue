<template>
  <div class="w-full h-full p-4 flex flex-col gap-4">
    <source-config v-model:source="source" v-model:cube="cube" v-model:language="language" />
    <cube-viewer
      v-if="cube"
      :source="source"
      :cube="cube"
      :language="language"
      class="bg-white rounded shadow-lg overflow-x-auto"
    />
  </div>
</template>

<script>
import CubeViewer from './components/CubeViewer.vue'
import SourceConfig from './components/SourceConfig.vue'

const defaultLanguage = ['en', '*']

export default {
  name: 'App',
  components: { CubeViewer, SourceConfig },

  data () {
    return {
      source: null,
      cube: null,
      language: defaultLanguage,
    }
  },
}
</script>
