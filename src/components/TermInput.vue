<template>
  <input type="text" :value="modelValue?.value" @change="update" />
</template>

<script>
import { defineComponent } from 'vue'
import * as $rdf from '@rdfjs/data-model'
import { Term } from '@rdfjs/data-model'

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
        ? $rdf.literal(textValue, this.datatype)
        : null

      this.$emit('update:modelValue', value)
    },
  },
})
</script>
