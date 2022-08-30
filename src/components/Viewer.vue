<script setup>
/* eslint-disable */
import { useAsyncState, useUrlSearchParams } from '@vueuse/core'
import { Source } from 'rdf-cube-view-query'
import { defineEmits, defineProps, onMounted, ref, shallowRef, watch } from 'vue'
import { getBoundedViewPointer } from './common/debug.js'
import { viewFromCubeUri, viewFromDataset, viewFromViewUri } from './common/viewLoaders.js'
import LoadingIcon from './icons/LoadingIcon.vue'
import ShareUrlButton from './ShareUrlButton.vue'
import MetadataHeader from './MetadataHeader.vue'

import TabularView from './TabularView.vue'

const DELAY = 0
const props = defineProps({
  source: {
    type: Source,
    required: true
  },
  viewInput: {
    type: Object
  }
})

const emit = defineEmits(['setViewInput'])
const view = shallowRef(null)

onMounted(async () => {
  await initFromProps()
})

watch(() => props.viewInput, () => initFromProps())
watch(() => props.source, () => initFromProps())

const {
  isLoading,
  state,
  isReady,
  execute,
  error
} = useAsyncState(
  async (args) => {
    return fetchView(args)
  },
  {},
  {
    delay: DELAY,
    resetOnExecute: false,
    immediate: false
  }
)

async function initFromProps () {
  await execute(DELAY, {
    source: props.source,
    viewInput: props.viewInput,
  })
}

async function updateDataset ({ dataset }) {
  emit('setViewInput', { dataset })
}

async function fetchView ({
  source,
  viewInput,
}) {
  const {
    cubeUri,
    viewUri,
    dataset
  } = viewInput

  if (!(cubeUri || viewUri || dataset)) {
    throw Error(`No cubeUri, viewUri or dataset`)
  }
  if (cubeUri) {
    return await viewFromCubeUri({
      source,
      cubeUri
    })
  } else if (viewUri) {
    return await viewFromViewUri({
      source,
      viewUri
    })
  } else if (dataset) {
    return await viewFromDataset({
      dataset,
      fallbackSource: source
    })
  }
  }

const tabularView = ref()
const params = useUrlSearchParams('history')
const shareButton = ref()

function prepareParams(){
  console.log('Prepare params')
  if (tabularView.value){
    const currentView = tabularView.value.currentView
    const dataset = getBoundedViewPointer(currentView).dataset
    const datasetN3 = dataset.toString()
    const url = new URL(window.location.href);
    url.searchParams.set("view",datasetN3);
    url.searchParams.delete("cubeUri")
    url.searchParams.delete("viewUri")
    shareButton.value.copyURL(url)
  }
}

</script>

<template>
  <div class="p-4">
    <div v-if="isLoading">
      <loading-icon/>
    </div>

    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>

    <div class="flex flex-col gap-4" v-if="isReady">
      <header v-if="state">
        <template v-for="cube in state.cubes()">
          <MetadataHeader :pointer="state.ptr.node(cube)"></MetadataHeader>
        </template>
        <share-url-button
          ref="shareButton"
          class="items-end"
          @prepareParams="prepareParams"
        />
      </header>
      <tabular-view
        ref="tabularView"
        @updateDataset="updateDataset"
        v-if="state"
        :view="state"/>
    </div>
  </div>
</template>
