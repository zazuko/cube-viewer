<script setup>
/* eslint-disable */
import '@rdfjs-elements/rdf-editor'
import rdf from 'rdf-ext'

import { computed, defineEmits, defineProps, onMounted, ref } from 'vue'
import { View } from 'rdf-cube-view-query'

import { getBoundedViewPointer } from '../common/debug.js'
import Editbox from './Editbox.vue'

const emit = defineEmits(['updateDataset'])

const props = defineProps({
  initialState: {
    default: 1,
    type: Number
  },
  debugView: {
    type: View,
    required: true
  }
})

const CURRENT_VIEW = 1
const ALL = 2
const IMPORT_QUADS = 3
const OTHERS = 4

const editBoxQuads = ref([])

async function updateEditBoxQuads (contents) {
  editBoxQuads.value = contents
}

async function loadViewFromData () {
  const dataset = rdf.dataset()
  dataset.addAll(editBoxQuads.value)
  emit('updateDataset', { dataset })
}

async function roundTrip () {
  const dataset = getBoundedViewPointer(props.debugView).dataset
  emit('updateDataset', { dataset })
}

const state = ref()

onMounted(() => {
  state.value = props.initialState
})

const viewBoxQuads = computed(() => {
  return [...getBoundedViewPointer(props.debugView).dataset]
})

const allQuads = computed(() => {
  return [...props.debugView.ptr.dataset]
})

const viewInfo = computed(() => {

  const result = []
  for (const dimension of props.debugView.dimensions) {
    result.push({
      viewDimensionTerm: dimension.ptr.term.value,
      cubeDimensionsTerms:dimension.cubeDimensions.map(x => x.path.value),
      cubesTerms:dimension.cubes.map(x => x.value)
    })
  }

  return result
})

const sources = computed(() => {
  return {
    endpoints:props.debugView.sources().map(x => x.endpoint),
  }
})


</script>

<template>

  <div class="container">
    <div class="menu">
      <button
        :class=" state===CURRENT_VIEW?'menu-item-selected':'menu-item'"
        @click="state=CURRENT_VIEW"
      >
        Current view
      </button>
      <button
        :class=" state===ALL?'menu-item-selected':'menu-item'"
        @click="state=ALL"
      >
        All
      </button>
      <button
        :class=" state===IMPORT_QUADS?'menu-item-selected':'menu-item'"
        @click="state=IMPORT_QUADS"
      >
        Import
      </button>
      <button
        :class=" state===OTHERS?'menu-item-selected':'menu-item'"
        @click="state=OTHERS"
      >
        Info
      </button>
    </div>
    <div class="main">
      <div class="controls">

        <template
          v-if="state===CURRENT_VIEW"
        >
          <div class="gloss">
            {{ viewBoxQuads.length }} quads for this view
          </div>
        </template>

        <template
          v-if="state===IMPORT_QUADS"
        >
          <div class="gloss"
               v-if="!editBoxQuads.length">
            Paste some turtle to import it
          </div>
          <button
            v-else
            @click="loadViewFromData"
            class=" bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white py-2 px-4 border border-gray-500 hover:border-transparent rounded">
            Import {{ editBoxQuads.length }} Quads
          </button>
        </template>

        <template
          v-if="state===ALL"
        >
          <div class="gloss">
            {{ allQuads.length }} quads in memory
          </div>
        </template>

        <template
          v-if="state===OTHERS"
        >

          <div class="gloss">
            Current view
          </div>
          <div>
            <table>
              <tr>
                <th>View dimension</th>
                <th>Cube dimensions</th>
                <th>Cubes</th>
              </tr>
              <tr v-for="{viewDimensionTerm,cubeDimensionsTerms,cubesTerms} of viewInfo">
                <td>{{ viewDimensionTerm }}</td>
                <td>{{ cubeDimensionsTerms }}</td>
                <td>{{ cubesTerms }}</td>
              </tr>
            </table>
          </div>
          <div class="gloss">
            Sources
          </div>
          <div>
            {{sources}}
          </div>
          <div class="gloss"
               v-if="!editBoxQuads.length">
            Export and import the current view
          </div>
          <button
            @click="roundTrip"
            class=" bg-transparent hover:bg-gray-500 text-gray-700 font-semibold hover:text-white py-2 px-4 border border-gray-500 hover:border-transparent rounded">
            round trip
          </button>
        </template>


      </div>
      <div class="content">
        <Editbox
          v-if="state===CURRENT_VIEW"
          format="text/turtle"
          :quads="viewBoxQuads"/>

        <Editbox
          v-if="state===IMPORT_QUADS"
          title="Import"
          format="text/turtle"
          @updateView="updateEditBoxQuads"
        />
        <Editbox
          v-if="state===ALL"
          format="text/turtle"
          :quads="allQuads"
        />
      </div>
    </div>
  </div>


</template>

<style scoped>


.container {
  display: flex;
  flex-direction: row;
}

.menu {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.menu-item {
  height: 50px;
  border: darkgray solid 1px;
}

.menu-item-selected {
  height: 50px;
  border: black solid 2px;
}

.main {
  background-color: rgb(243, 244, 246);
  display: flex;
  flex-direction: column;
}

.controls {
  margin-top: 10px;
  flex: 1;
  gap: 10px;
  margin-left: 20px;
  margin-bottom: 10px;
}

.gloss {
  /*align-self: center;*/

  margin-top: 10px;
  margin-bottom: 10px;
}

.content {
  align-self: center;
  flex: 5
}

.clickable {
  cursor: pointer;
}
</style>
