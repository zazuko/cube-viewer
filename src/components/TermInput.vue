<script setup>
/* eslint-disable */

import { Term } from '@rdfjs/data-model'
import RDF from 'rdf-ext'
import { defineProps } from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Term,
    required: false
  },
  datatype: {
    type: Term,
    required: false
  }
})

function update (event) {
  const textValue = event.target.value
  const value = textValue
    ? RDF.literal(textValue, props.datatype)
    : null

  emit('update:modelValue', value)

}


</script>


<template>
  <input type="text" :value="modelValue?.value" @change="update"/>
</template>
