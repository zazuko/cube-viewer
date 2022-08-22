<script setup>
/* eslint-disable */
import { useUrlSearchParams } from '@vueuse/core'
import { Parser } from 'n3'
import { Source } from 'rdf-cube-view-query'
import rdf from 'rdf-ext'
import { onMounted, ref } from 'vue'
import SourceConfig from './components/SourceConfig.vue'
import Viewer from './components/Viewer.vue'

const parser = new Parser()

const defaultLanguage = ['en', '*']

const params = useUrlSearchParams('history')

const language = ref(defaultLanguage)
const source = ref(null)

const viewInput = ref()

const initError = ref()
onMounted(() => {

  // Tries to parse a view
  let dataset = undefined
  if (params.view) {
    try {
      const quads = parser.parse(params.view)
      dataset = rdf.dataset().addAll(quads)
    } catch (e) {
      initError.value = e
    }
  }

  if (params.endpointUrl) {
    source.value = new Source({
      endpointUrl: params.endpointUrl,
      user: params.user,
      password: params.password,
      sourceGraph: params.sourceGraph
    })
  }

  viewInput.value = onlyOne({
    cubeUri: params.cubeUri,
    viewUri: params.viewUri,
    dataset
  })
})

// Defines order also
function onlyOne ({
  cubeUri,
  viewUri,
  dataset
}) {
  if (dataset) {
    return { dataset }
  }
  if (cubeUri) {
    return { cubeUri }
  }
  if (viewUri) {
    return { viewUri }
  }
  return {}
}

function inputParameterIsValid () {
  return source.value && (viewInput.value.viewUri || viewInput.value.cubeUri || viewInput.value.dataset)
}

function updateSource(source){
  params.endpointUrl = source.endpoint
  params.user = source.user
  console.log('updateSource',source)
}

// 'Hard' updates. Forces loading of labels.
function setViewInput (value) {
  // console.log('setViewInput',value)
  setURLParams(value)
  viewInput.value = value
}

function setURLParams (value) {
  params.viewUri = value.viewUri ? value.viewUri : undefined
  params.cubeUri = value.cubeUri ? value.cubeUri : undefined
  params.view = value.dataset ? value.dataset.toString() : undefined
}

</script>

<template>
  <div class="w-full h-full p-4 flex flex-col gap-4">
    <h1 class="font-bold text text-gray-600 uppercase">
      Zazuko Cube Viewer
    </h1>
    <template v-if="initError">
      <div class="text-red-500">
        {{ initError }}
      </div>
    </template>
    <template v-else>
      <source-config
        v-if="viewInput"
        :viewInput="viewInput"
        v-model:source="source"
        v-model:language="language"
        @setViewInput="setViewInput"
        @update:source="updateSource"
      />
      <viewer
        v-if="inputParameterIsValid()"
        :source="source"
        :language="language"
        :viewInput="viewInput"
        @setViewInput="setViewInput"
        class="bg-white rounded shadow-lg overflow-x-auto"
      />
    </template>
  </div>
</template>
