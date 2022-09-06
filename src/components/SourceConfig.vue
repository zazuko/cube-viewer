<script setup>
/* eslint-disable */
import { XCircleIcon } from '@heroicons/vue/outline'
import { CogIcon } from '@heroicons/vue/solid'
import { useUrlSearchParams } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Source } from 'rdf-cube-view-query'
import { computed, defineEmits, defineProps, onMounted, ref } from 'vue'
import useLangStore from '../stores/langStore.js'
import CubeSelector from './CubeSelector.vue'

import SelectBox from './SelectBox.vue'
import ViewSelector from './ViewSelector.vue'

const entityTypes = ['cubes', 'views']
const languages = ['de', 'fr', 'it', 'rm', 'en']

const params = useUrlSearchParams('history')

const props = defineProps({
  source: {
    type: Source,
    required: false
  },
  viewInput: {
    type: Object,
    required: false
  }
})

const emit = defineEmits(['update:source', 'setViewInput'])

const open = ref()
const options = ref()
const ifNoInputSelected = ref('cubes')

onMounted(() => {
  open.value = !(props.source?.endpoint)
  options.value = {
    endpointUrl: params.endpointUrl ? params.endpointUrl : process.env.VUE_APP_ENDPOINT_URL,
    user: params.user,
    password: params.password,
    sourceGraph: params.sourceGraph
  }
})

const entityType = computed(() => {
  if (props.viewInput) {
    const {
      cubeUri,
      viewUri,
      dataset
    } = props.viewInput
    if (cubeUri) {
      return 'cubes'
    } else if (viewUri) {
      return 'views'
    } else if (dataset) {
      return 'link'
    } else {
      return ifNoInputSelected.value
    }
  }
})

const langStore = useLangStore()
const {
  language,
  pointer
} = storeToRefs(langStore)

function updateLanguage (language) {
  language.value = [language, ...languages, '*']
}

function isValid () {
  return options.value?.endpointUrl
}

function updateSource () {
  if (isValid()) {
    const source = new Source(options.value)
    emit('update:source', source)
    open.value = false
  }
}

function switchEntityType (arg) {
  ifNoInputSelected.value = arg
  emit('setViewInput', {})
}

function updateCubeUri (cubeUri) {
  emit('setViewInput', { cubeUri })
}

function updateViewUri (viewUri) {
  emit('setViewInput', { viewUri })
}

function clearInput (value) {
  emit('setViewInput', {})
}

</script>

<template>

  <div class="p-3 bg-white shadow-lg flex justify-between items-center">
    <form @submit.prevent="updateSource" v-if="open" class="w-1/3 flex flex-col gap-2">
      <label class="form-field">
        <span class="label">Endpoint URL</span>
        <input type="text" v-model="options.endpointUrl"/>
      </label>

      <label class="form-field">
        <span class="label">Username</span>
        <input type="text" v-model="options.user" />
      </label>

      <label class="form-field">
        <span class="label">Password</span>
        <input type="text" v-model="options.password" />
      </label>

      <label class="form-field">
        <span class="label">Source graph</span>
        <input type="text" v-model="options.sourceGraph" />
      </label>

      <div class="flex justify-between">
        <button type="submit" class="button-primary" :disabled="!isValid">
          Fetch cubes
        </button>
        <button type="button" class="button-text" title="Close" @click="open = false">
          <x-circle-icon class="h-6 w-6" />
        </button>
      </div>
    </form>

    <div v-show="!open" class="flex items-end gap-2">
      <template v-if="entityType==='views' || entityType==='cubes' ">
        <select-box :options="entityTypes" :model-value="entityType" @update:model-value="switchEntityType">
          <template v-slot:button="{ selected }">
            {{ selected }}
          </template>
          <template v-slot:option="{ option }">
            {{ option }}
          </template>
        </select-box>

        <cube-selector
          v-if="source && entityType==='cubes' "
          :source="source"
          :cube-uri="viewInput.cubeUri"
          @select="updateCubeUri"
        />
        <view-selector
          v-if="source && entityType==='views'"
          :source="source"
          :view-uri="viewInput.viewUri"
          @select="updateViewUri"
        />
      </template>
      <button class="button" @click="open = true">
        <cog-icon class="h-4 w-4"/>
        Endpoint config
      </button>
      <select-box :options="languages" :model-value="language[0]" @update:model-value="updateLanguage">
        <template v-slot:button="{ selected }">
          {{ selected }}
        </template>
        <template v-slot:option="{ option }">
          {{ option }}
        </template>
      </select-box>
      <template v-if="entityType==='link'">
        <button type="button" class="button-text" title="Close" @click="clearInput">
          Clear
          <x-circle-icon class="h-6 w-6"/>
        </button>
      </template>
    </div>

  </div>
</template>
