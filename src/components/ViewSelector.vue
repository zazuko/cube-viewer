<template>
  <div v-if="views.isLoading" class="p-2 flex items-center gap-2">
    <loading-icon />
    Loading views ...
  </div>
  <div v-else-if="views.error" class="p-2 text-red-500">
    {{ views.error }}
  </div>
  <select v-else :value="viewUri" @change="onSelect">
<!--    <option>Select view</option>-->
    <option v-for="view in views.data" :key="view.term.value" :value="view.term.value">
      {{ view.term.value }}
    </option>
  </select>
</template>

<script>
import { Source } from 'rdf-cube-view-query'
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import * as Remote from '../remote'
import LoadingIcon from './icons/LoadingIcon.vue'

export default defineComponent({
  name: 'ViewSelector',
  components: { LoadingIcon },
  props: {
    source: {
      type: Source,
      required: true,
    },
    viewUri: String,
  },
  emits: ['select'],

  setup (props) {
    const { source } = toRefs(props)
    const views = ref(Remote.loading())
    const fetchCubes = async () => {
      views.value = Remote.loading()
      views.value = await Remote.fetch(async () => {
        return source.value.views({
          noShape: true,
        })
      })
    }
    onMounted(fetchCubes)
    watch(source, fetchCubes)

    return {
      views,
    }
  },

  methods: {
    onSelect (event) {
      this.$emit('select', event.target.value)
    },
  },
})
</script>
