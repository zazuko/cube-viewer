<template>
  <div class="w-full h-full p-4 flex flex-col gap-4">
    <h1 class="font-bold text text-gray-600 uppercase">
      Zazuko Cube Viewer
    </h1>
    <source-config v-model:source="source" v-model:cubeUri="cubeUri" v-model:language="language" />
    <cube-viewer
      v-if="source && cubeUri"
      :source="source"
      :cubeUri="cubeUri"
      :language="language"
      class="bg-white rounded shadow-lg overflow-x-auto"
    />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import CubeViewer from './components/CubeViewer.vue'
import SourceConfig from './components/SourceConfig.vue'
import { Source } from 'rdf-cube-view-query'

const defaultLanguage = ['en', '*']

export default defineComponent({
  name: 'App',
  components: { CubeViewer, SourceConfig },

  setup () {
    const urlParams = new URLSearchParams(window.location.search.substring(1))

    const source = ref(null)
    const endpointUrl = urlParams.get('endpointUrl')
    if (endpointUrl) {
      source.value = new Source({
        endpointUrl,
        user: urlParams.get('user') || undefined,
        password: urlParams.get('password') || undefined,
        sourceGraph: urlParams.get('sourceGraph') || undefined,
      })
    }

    const cubeUri = ref(urlParams.get('cube'))

    const language = ref(defaultLanguage)

    return {
      source,
      cubeUri,
      language,
    }
  },
})
</script>
