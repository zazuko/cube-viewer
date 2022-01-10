<template>
  <input type="text" :value="modelValue?.value" @change="update" />
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import RDF from 'rdf-ext'

export default defineComponent({
  name: 'TermInput',
  props: {
    modelValue: {
      type: Term,
      required: false,
    },
    datatype: {
      type: Term,
      required: false,
    },
  },
  emits: ['update:modelValue'],

  methods: {
    update (event) {
      const textValue = event.target.value
      const value = textValue
        ? RDF.literal(textValue, this.datatype)
        : null

      this.$emit('update:modelValue', value)
    },
  },
})
</script>
