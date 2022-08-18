<script setup>
import { useUrlSearchParams } from '@vueuse/core'
import { Source } from 'rdf-cube-view-query'
/* eslint-disable */
import { onMounted, ref } from 'vue'
import SourceConfig from './components/SourceConfig.vue'
import Viewer from './components/Viewer.vue'
import { Parser } from 'n3'
import rdf from 'rdf-ext'

const parser = new Parser()

const defaultLanguage = ['en', '*']

const params = useUrlSearchParams('history')

const language = ref(defaultLanguage)
const source = ref(null)

const viewInput = ref()

function onlyOne ({
  cubeUri,
  viewUri,
  view
}) {
  if (cubeUri) {
    return { cubeUri }
  }
  if (viewUri) {
    return { viewUri }
  }
  if (view) {
    const quads = parser.parse(view)
    const dataset = rdf.dataset().addAll(quads)
    return { dataset }
  }
  return {}
}

onMounted(() => {
  if (params.endpointUrl) {
    source.value = new Source({
      endpointUrl: params.endpointUrl,
      user: params.user,
      password: params.password,
      sourceGraph: params.sourceGraph
    })
  }

  viewInput.value = onlyOne({ ...params })
})

function inputParameterIsValid () {
  return source.value && (viewInput.value.viewUri || viewInput.value.cubeUri || viewInput.value.dataset)
}

function setViewInput (value) {
  params.viewUri = value.viewUri?value.viewUri:undefined
  params.cubeUri = value.cubeUri?value.cubeUri:undefined
  viewInput.value = value
}

</script>

<template>
  <div class="w-full h-full p-4 flex flex-col gap-4">
    <h1 class="font-bold text text-gray-600 uppercase">
      Zazuko Cube Viewer
    </h1>
    <source-config
      v-if="viewInput"
      :viewInput="viewInput"
      v-model:source="source"
      v-model:language="language"
      @setViewInput="setViewInput"
    />
    <viewer
      v-if="inputParameterIsValid()"
      :source="source"
      :language="language"
      :viewInput="viewInput"
      class="bg-white rounded shadow-lg overflow-x-auto"
    />
  </div>
</template>
