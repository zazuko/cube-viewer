<script setup>
/* eslint-disable */
import { useAsyncState, useUrlSearchParams } from '@vueuse/core'
import { Source } from 'rdf-cube-view-query'
import { defineEmits, defineProps, onMounted, ref, watch, shallowRef} from 'vue'
import { getBoundedViewPointer } from './common/debug.js'
import { viewFromCubeUri, viewFromDataset, viewFromViewUri } from './common/viewLoaders.js'
import LoadingIcon from './icons/LoadingIcon.vue'
import MetadataHeader from './MetadataHeader.vue'
import ShareUrlButton from './ShareUrlButton.vue'
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

async function fetchView ({
  source,
  viewInput
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

const {
  isLoading: viewIsLoading,
  state,
  isReady: viewIsReady,
  error: viewError,
  execute
} = useAsyncState(
  async (args) => {
    console.log('Fetching')
    view.value = await fetchView(args)
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
    viewInput: props.viewInput
  })
}

watch(() => props.viewInput, () => initFromProps())
watch(() => props.source, () => initFromProps())

async function updateDataset ({ dataset }) {
  emit('setViewInput', { dataset })
}

const tabularView = ref()
const shareButton = ref()

const params = useUrlSearchParams('hash-params')

function prepareParams () {
  if (tabularView.value) {
    const currentView = tabularView.value.currentView
    const dataset = getBoundedViewPointer(currentView).dataset
    const datasetN3 = dataset.toString()
    const endpointUrl = params.endpointUrl
    const url = new URL(`${document.location.protocol}//${document.location.host}/#view=${encodeURIComponent(datasetN3)}&endpointUrl=${encodeURIComponent(endpointUrl)}`)
    shareButton.value.copyURL(url)
  }
}

</script>

<template>
  <div class="p-4">
    <div v-if="viewIsLoading">
      <loading-icon/>
    </div>

    <div v-if="viewError" class="text-red-500">
      {{ viewError }}
    </div>

    <share-url-button
      v-if="view"
      ref="shareButton"
      @prepareParams="prepareParams"
    />

    <div class="flex flex-col gap-4" v-if="viewIsReady">
      <header v-if="view">
        <template v-if="view.cubes" v-for="cube in view.cubes()">
          <div>
            <MetadataHeader :pointer="view.ptr.node(cube)"></MetadataHeader>
          </div>
        </template>
      </header>
      <template v-if="view">
        <tabular-view
          ref="tabularView"
          @updateDataset="updateDataset"
          :view="view"/>
      </template>

    </div>
  </div>
</template>
