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
            :pointer="item.data.ptr"
            :is-open="isMetadataOpen"
            @close="isMetadataOpen = false"
          />
        </div>
      </header>
      <tabular-view
        :key="count"
        v-if="view"
        :view="view"
        :language="language"/>

      <div class="import">

        <div class="edit-box">
          <Editbox
            title="Import"
            format="text/turtle"
            @updateView="updateQuads"
          />
        </div>
        <div class="edit-box-button">
          <button
            @click="loadView"
            class=" bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white py-2 px-4 border border-gray-500 hover:border-transparent rounded">
            Import {{ quads.length }} Quads
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>

.import {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

.edit-box {
  max-width: 70%;
  border: darkgray solid 1px;
}

.edit-box-button {
  align-self: flex-start;
}

.clickable {
  cursor: pointer;
}

</style>

<script>
import { InformationCircleIcon } from '@heroicons/vue/outline'
import { Source } from 'rdf-cube-view-query'
import rdf from 'rdf-ext'
import { defineComponent, onMounted, ref, shallowRef, toRefs, watch } from 'vue'
import * as ns from '../namespace'
import * as Remote from '../remote'
import { applyDefaults, viewFromCube, viewFromDataset } from './common/viewUtils.js'
import LoadingIcon from './icons/LoadingIcon.vue'
/* eslint-disable */
import Editbox from './rdf/Editbox.vue'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'
import TabularView from './TabularView.vue'

async function fetchView ({
  entityType,
  uri,
  data,
  source
}) {
  if (entityType === 'cubes') {
    const cube = await source.cube(uri)
    return viewFromCube({ cube })
  } else if (entityType === 'views') {
    const view = await source.view(uri)
    await view.fetchCubeShape()
    return applyDefaults({ view })
  } else {
    throw Error(`entityType ${entityType} not recognized`)
  }
}


export default defineComponent({
  name: 'ItemViewer',
  components: {
    InformationCircleIcon,
    LoadingIcon,
    ResourceDetailsDialog,
    TabularView,
    Editbox
  },
  props: {
    source: {
      type: Source,
      required: true,
    },
    uri: {
      type: String,
    },
    entityType: {
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
      entityType,
    } = toRefs(props)

    const count = ref(1)
    const item = shallowRef(Remote.loading())
    const view = shallowRef(null)
    const fetchItem = async () => {
      if (typeof item.value?.data?.clear === 'function') {
        item.value.data.clear()
      }

      item.value = Remote.loading()

      try {
        view.value = await fetchView({
          source: source.value,
          entityType: entityType.value,
          uri: uri.value,
        })
        const itemData = view.value

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

    const isMetadataOpen = ref(false)

    const quads = ref([])

    async function updateQuads (contents) {
      quads.value = contents
    }

    async function loadView () {
      const dataset = rdf.dataset()
      dataset.addAll(quads.value)
      view.value = await viewFromDataset(dataset)
      count.value = count.value + 1
    }

    return {
      item,
      isMetadataOpen,
      view,
      updateQuads,
      count,
      quads,
      loadView
    }
  },

  computed: {

    title () {
      if (!this.item.data) {
        return null
      }
      const title = this.item.data.ptr.out(ns.schema.name, { language: this.language }).value
      return title ?? null
    },

    description () {
      if (!this.item.data) {
        return null
      }
      const description = this.item.data.ptr.out(ns.schema.description, { language: this.language }).value
      return description ?? null
    },

  },

  methods: {},
})


</script>
