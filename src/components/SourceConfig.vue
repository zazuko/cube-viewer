<template>
  <div class="p-3 bg-white shadow-lg">
    <form @submit.prevent="updateSource" v-if="open" class="w-1/3 flex flex-col gap-2">
      <label class="form-field">
        <span class="label">Endpoint URL</span>
        <input type="text" v-model="options.endpointUrl" />
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
      <cube-selector v-if="source" :source="source" :cube="cube" @select="$emit('update:cube', $event)" />
      <button class="button" @click="open = true">
        <cog-icon class="h-4 w-4" />
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
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, toRefs } from 'vue'
import { Cube, Source } from 'rdf-cube-view-query'
import { CogIcon } from '@heroicons/vue/solid'
import { XCircleIcon } from '@heroicons/vue/outline'
import CubeSelector from './CubeSelector.vue'
import SelectBox from './SelectBox.vue'

const languages = ['de', 'fr', 'it', 'rm', 'en']

export default defineComponent({
  name: 'SourceConfig',
  components: { CogIcon, CubeSelector, SelectBox, XCircleIcon },
  props: {
    source: {
      type: Source,
      required: false,
    },
    cube: {
      type: Cube,
      required: false,
    },
    language: {
      type: [Array, String],
      required: false,
    },
  },
  emits: ['update:source', 'update:cube', 'update:language'],

  setup (props) {
    const { source } = toRefs(props)

    const optionsInit = source.value
      ? { ...source }
      : { endpointUrl: process.env.VUE_APP_ENDPOINT_URL }
    const options = ref(optionsInit)

    const open = ref(!source.value)

    return {
      options,
      open,
      languages,
    }
  },

  computed: {
    isValid () {
      return this.options.endpointUrl
    },
  },

  methods: {
    updateSource () {
      if (!this.isValid) return

      const source = new Source(this.options)
      this.$emit('update:source', source)
      this.open = false
    },

    updateLanguage (language) {
      const languageList = [language, ...languages, '*']
      this.$emit('update:language', languageList)
    },
  },
})
</script>
