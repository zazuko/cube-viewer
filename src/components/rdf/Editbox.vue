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
  title: String,
  isOpen: {
    default: false
  }
})

const parseError = ref()

function onParsingFailed (e) {
  parseError.value = e?.detail?.error
}

let isOpen = ref()

const editor = ref()

function onQuadsChanged({ detail }){
  console.log('updating',detail.value.length,'quads')
  parseError.value = ''
  emit('updateView', detail.value)
}

onMounted(()=>{
  isOpen.value = props.isOpen
})

</script>

<template>
  <div class="edit-box-container">
    <h4 class="clickable" v-if="title" @click="isOpen=!isOpen">{{ title?title:'undefined' }}</h4>
    <div v-if="parseError">
      {{ parseError }}
    </div>

    <rdf-editor v-if="isOpen===true"
                ref="editor"
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

.clickable {
  cursor: pointer;
  align-self: center;
}

.edit-box-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 400px;
}
</style>
