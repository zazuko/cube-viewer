<script setup>
/* eslint-disable */
import { InformationCircleIcon } from '@heroicons/vue/outline'
import { useAsyncState, useUrlSearchParams } from '@vueuse/core'
import { Source } from 'rdf-cube-view-query'
import { computed, defineEmits, defineProps, onMounted, ref, shallowRef, watch } from 'vue'
import * as ns from '../namespace'
import { getBoundedViewPointer } from './common/debug.js'
import { viewFromCubeUri, viewFromDataset, viewFromViewUri } from './common/viewLoaders.js'
import LoadingIcon from './icons/LoadingIcon.vue'
import ShareUrlButton from './ShareUrlButton.vue'

import ResourceDetailsDialog from './ResourceDetailsDialog.vue'
import TabularView from './TabularView.vue'

const DELAY = 0
const props = defineProps({
  source: {
    type: Source,
    required: true
  },
  viewInput: {
    type: Object
  },
  language: {
    type: [String, Array],
    required: false
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

const isMetadataOpen = ref(false)

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

const title = computed(() => {
  if (!view.value) {
    return null
  }
  const title = view.value.ptr.out(ns.schema.name, { language: props.language }).value
  return title ?? null
})

const description = computed(() => {
  if (!view.value) {
    return null
  }
  const description = view.value.ptr.out(ns.schema.description, { language: props.language }).value
  return description ?? null
})

const errorMessage = computed(() => {
  if (error && ! isLoading) {
    return error
  }
  return undefined
})

const tabularView = ref()
const shareButton = ref()
const params = useUrlSearchParams('history')

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

        <div class="flex flex-row">
          <h1 class="font-bold mb-2 grow" :title="state.term.value">
            <span v-if="title">{{ title }}</span>
            <span v-else class="text-gray-500">Untitled</span>
          </h1>
          <share-url-button
            ref="shareButton"
            class="items-end"
            @prepareParams="prepareParams"
          />
        </div>
        <section v-if="description" class="text-sm text-gray-700">
          {{ description }}
        </section>
        <div>
          <button @click="isMetadataOpen = true" title="Metadata">
            <information-circle-icon class="text-gray-500 w-5 h-5"/>
          </button>
          <resource-details-dialog
            title="Metadata"
            :pointer="state.ptr"
            :is-open="isMetadataOpen"
            @close="isMetadataOpen = false"
          />
        </div>

      </header>
      <tabular-view
        ref="tabularView"
        @updateDataset="updateDataset"
        v-if="state"
        :view="state"
        :language="language"/>
    </div>
  </div>
</template>
