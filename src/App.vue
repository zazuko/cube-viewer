<template>
  <div class="w-full h-full p-4 flex flex-col gap-4">
    <h1 class="font-bold text text-gray-600 uppercase">
      Zazuko Cube Viewer
    </h1>
    <source-config
      v-model:source="source"
      v-model:uri="uri"
      v-model:language="language"
      v-model:entityType="entityType"/>
    <viewer
      v-if="source && uri"
      :source="source"
      :uri="uri"
      :language="language"
      :entityType="entityType"
      class="bg-white rounded shadow-lg overflow-x-auto"
      />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import Viewer from './components/Viewer.vue'

import SourceConfig from './components/SourceConfig.vue'
import { Source } from 'rdf-cube-view-query'

const defaultLanguage = ['en', '*']

export default defineComponent({
  name: 'App',
  components: { SourceConfig, Viewer },

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
    const viewUri = ref(urlParams.get('view'))

    const language = ref(defaultLanguage)

    const entityType = ref(viewUri.value ? 'views' : 'cubes')
    const uri = ref(cubeUri.value ? cubeUri.value : viewUri.value)

    return {
      source,
      language,
      entityType,
      uri,
    }
  },
})
</script>
