<template>
  <div class="p-4">
    <div v-if="item.isLoading">
      <loading-icon/>
    </div>
    <div v-else-if="item.error" class="text-red-500">
      {{ item.error }}
    </div>
    <div class="flex flex-col gap-4" v-else>
      <header>
        <h1 class="font-bold mb-2" :title="item.data.term.value">
          <span v-if="title">{{ title }}</span>
          <span v-else class="text-gray-500">Untitled</span>
        </h1>
        <section v-if="description" class="text-sm text-gray-700">
          {{ description }}
        </section>
        <div>
          <button @click="isMetadataOpen = true" title="Metadata">
            <information-circle-icon class="text-gray-500 w-5 h-5"/>
          </button>
          <resource-details-dialog
            title="Metadata"
            :resource="item.data.ptr"
            :is-open="isMetadataOpen"
            @close="isMetadataOpen = false"
          />
        </div>
      </header>
      <tabular-view v-if="view" :view="view" :cube="cube" :language="language"/>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import { InformationCircleIcon } from '@heroicons/vue/outline'
import { Source } from 'rdf-cube-view-query'
import LoadingIcon from './icons/LoadingIcon.vue'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import TabularView from './TabularView.vue'
import { viewFromCube } from './common/viewFromCube.js'

export default defineComponent({
  name: 'ItemViewer',
  components: {
    InformationCircleIcon,
    LoadingIcon,
    ResourceDetailsDialog,
    TabularView,
  },
  props: {
    source: {
      type: Source,
      required: true,
    },
    uri: {
      type: String,
    },
    language: {
      type: [String, Array],
      required: false,
    },
  },

  setup (props) {
    const {
      source,
      uri,
    } = toRefs(props)

    const item = shallowRef(Remote.loading())

    const fetchItem = async () => {
      if (typeof item.value?.data?.clear === 'function') {
        item.value.data.clear()
      }

      item.value = Remote.loading()

      try {
        const itemData = await source.value.cube(uri.value)

        if (itemData) {
          item.value = Remote.loaded(itemData)
        } else {
          if (typeof item.value?.data?.clear === 'function') {
            item.value.data.clear()
          }
          item.value = Remote.error(`Could not find ${uri.value}`)
        }
      } catch (e) {
        console.error(e)

        if (typeof item.value?.data?.clear === 'function') {
          item.value.data.clear()
        }
        item.value = Remote.error(e)
      }
    }
    onMounted(fetchItem)
    watch(uri, fetchItem)

    const cube = shallowRef(null)
    const view = shallowRef(null)

    const update = () => {
      if (!item.value.data) return

      if (view.value) {
        view.value.clear()
      }
      cube.value = item.value.data
      view.value = viewFromCube({ cube: cube.value })
    }

    watch([item], update)

    const isMetadataOpen = ref(false)

    return {
      item,
      isMetadataOpen,
      cube,
      view,
    }
  },

  computed: {

    title () {
      const title = this.item.data.out(ns.schema.name, { language: this.language }).value
      return title ?? null
    },

    description () {
      const description = this.item.data.out(ns.schema.description, { language: this.language }).value
      return description ?? null
    },

  },

  methods: {},
})

</script>
