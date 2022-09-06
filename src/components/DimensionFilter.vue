<script setup>
/* eslint-disable */
import { CubeDimension } from 'rdf-cube-view-query'
import { defineEmits, defineProps } from 'vue'
import useLangStore from '../stores/langStore.js'
import { operations } from './common/filters.js'
import SelectBox from './SelectBox.vue'
import TermDisplay from './TermDisplay.vue'
import TermInput from './TermInput.vue'

const emit = defineEmits(['update:filter'])

const props = defineProps({
  dimension: {
    type: CubeDimension,
    required: true
  },
  filter: {
    type: Object,
    required: true
  }
})

const langStore = useLangStore()
const {
  getDisplayTerm
} = langStore

function updateOperation (operation) {
  emit('update:filter', {
    ...props.filter,
    operation
  })
}

function updateArg (arg) {
  emit('update:filter', {
    ...props.filter,
    arg
  })
}

</script>

<template>
  <fieldset class="flex items-center gap-2">
    <SelectBox :modelValue="filter.operation" @update:modelValue="updateOperation" :options="operations">
      <template v-slot:button="{ selected }">
        <span v-if="selected" :term="selected.term">{{ selected.label }}</span>
        <span v-else class="text-gray-500">Operation</span>
      </template>
    </SelectBox>
    <SelectBox v-if="dimension.in && dimension.in.length > 0" :modelValue="filter.arg" @update:modelValue="updateArg"
               :options="dimension.in">
      <template v-slot:button="{ selected }">
        <term-display v-if="selected" :term="getDisplayTerm(selected)"/>
        <span v-else class="text-gray-500">Value</span>
      </template>
      <template v-slot:option="{ option }">
        <term-display :term="getDisplayTerm(option)"/>
      </template>
    </SelectBox>
    <div v-else>
      <term-input
        placeholder="Value"
        :modelValue="filter.arg"
        @update:modelValue="updateArg"
        :datatype="dimension.datatype"
      />
    </div>
  </fieldset>
</template>
