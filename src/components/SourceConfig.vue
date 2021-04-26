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

      <div>
        <button type="submit" class="button-primary" :disabled="!isValid">
          Fetch cubes
        </button>
      </div>
    </form>
    <div v-else class="flex items-end gap-2">
      <cube-selector v-if="source" :source="source" :cube="cube" @select="$emit('update:cube', $event)" />
      <button class="button" @click="open = true">
        <cog-icon />
        Endpoint config
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, toRefs } from 'vue'
import { Cube, Source } from 'rdf-cube-view-query'
import CogIcon from './icons/CogIcon.vue'
import CubeSelector from './CubeSelector.vue'

export default defineComponent({
  name: 'SourceConfig',
  components: { CogIcon, CubeSelector },
  props: {
    source: {
      type: Source,
      required: false,
    },
    cube: {
      type: Cube,
      required: false,
    },
  },
  emits: ['update:source', 'update:cube'],

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
  },
})
</script>
