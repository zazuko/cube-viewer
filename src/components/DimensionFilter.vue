<script setup>
/* eslint-disable */
import { CubeDimension, Filter, ViewDimension } from 'rdf-cube-view-query'
import { defineEmits, defineProps, onMounted, ref } from 'vue'
import useLangStore from '../stores/langStore.js'
import { getOperationLabel, operations } from './common/filters.js'
import SelectBox from './SelectBox.vue'
import TermDisplay from './TermDisplay.vue'
import TermInput from './TermInput.vue'

const emit = defineEmits(['updateFilter'])

const props = defineProps({
  dimension: {
    type: CubeDimension,
    required: true
  },
  viewDimension: {
    type: ViewDimension,
    required: true
  },
  filterWrapper: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const langStore = useLangStore()
const {
  getDisplayTerm
} = langStore

function updateArg (_arg) {
  arg.value = _arg
  tryUpdate()
}

function updateOperation (_operation) {
  operation.value = _operation
  tryUpdate()
}

function tryUpdate () {
  if (arg.value && operation.value) {
    emit('updateFilter', {
      filter: new Filter({
        dimension: props.viewDimension,
        operation: operation.value.term,
        arg: arg.value
      }),
      index: props.index
    })
  }
}

const arg = ref()
const operation = ref()
const exceptionLabel = ref()

onMounted(() => {
  const {
    filter,
    exception
  } = props.filterWrapper

  if (exception) {
    exceptionLabel.value = exception
  } else if (filter) {
    operation.value = {
      label: getOperationLabel(filter.operation),
      term: filter.operation
    }
    arg.value = filter.arg
  }
})


</script>

<template>
  <fieldset class="flex items-center gap-2">

    <template v-if="filterWrapper.exception">{{ exceptionLabel }}</template>
    <template v-else>

      <SelectBox :modelValue="operation" @update:modelValue="updateOperation" :options="operations">
        <template v-slot:button="{ selected }">
          <span v-if="selected" :term="selected.term">{{ selected.label }}</span>
          <span v-else class="text-gray-500">Operation</span>
        </template>
      </SelectBox>
      <SelectBox v-if="dimension.in && dimension.in.length > 0" :modelValue="arg" @update:modelValue="updateArg"
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
          :modelValue="arg"
          @update:modelValue="updateArg"
          :datatype="dimension.datatype"
        />
      </div>
    </template>
  </fieldset>
</template>
