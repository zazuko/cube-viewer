<script setup>
/* eslint-disable */
import '@rdfjs-elements/rdf-editor'

import { defineProps, defineEmits, ref, onMounted } from 'vue'

const emit = defineEmits(['updateView'])

const props = defineProps({
  format: {
    required: true,
    default: 'text/turtle',
    type: String
  },
  quads: Array,
})

const parseError = ref()

function onParsingFailed (e) {
  parseError.value = e?.detail?.error
}

const editor = ref()

function onQuadsChanged({ detail }){
  console.log('parsed',detail.value.length,'quads')
  parseError.value = ''
  emit('updateView', detail.value)
}

const prefixes = ref({
  view:'https://cube.link/view/',
  purl:'http://purl.org/dc/terms/',
  schema:'http://schema.org/',
  cube:'https://cube.link/',
  rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  shacl:'http://www.w3.org/ns/shacl#'
})

</script>

<template>

  <div class="edit-box-container">

    <div v-if="parseError">
      {{ parseError }}
    </div>

    <rdf-editor ref="editor"
                :customPrefixes="prefixes"
                :format="format"
                :quads="quads"
                auto-parse
                parseDelay="1000"
                @quads-changed="onQuadsChanged"
                @parsing-failed="onParsingFailed"
    />

  </div>

</template>
<style scoped>

.edit-box-container {
  display: flex;
  gap: 10px;
  flex-direction: column;
  min-width: 400px;
}
</style>
