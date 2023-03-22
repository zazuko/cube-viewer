<script setup>
/* eslint-disable */
import { computed, defineEmits, defineProps, onMounted, ref } from 'vue'
import { operations } from '../model/operation.js'
import useLangStore from '../stores/langStore.js'
import SelectBox from './SelectBox.vue'
import TermInput from './TermInput.vue'
import SelectBoxMultiple from './SelectBoxMultiple.vue'

import TermDisplay from './TermDisplay.vue'

const emit = defineEmits(['updateFilter'])

const props = defineProps({
  dimension: {
    type: Object,
    required: true
  },
  viewDimension: {
    type: Object,
    required: true
  },
  filterWrapper: {
    type: Object,
    required: true
  }
})

const langStore = useLangStore()
const {
  getDisplayTerm
} = langStore

const validOperations = ref([])
const currentOperation = ref()
const args = ref([])
const exceptionLabel = ref()

function updateOperation (operation) {
  currentOperation.value = operation
  args.value = []
}

function updateArg ({ term }) {
  args.value = [term]
  currentArg.value = term
  tryUpdate()
}

function updateArgs ({ terms }) {
  args.value = terms
  tryUpdate()
}

function tryUpdate () {
  if ((args.value.length) && currentOperation.value) {
    emit('updateFilter', {
      dimension: props.viewDimension,
      operation: currentOperation.value.term,
      args: args.value
    })
  }
}

onMounted(() => {

  validOperations.value = operations.filter(x => x.onlyLiterals ? !isNamed.value : true)
  const {
    filter,
    readOnly
  } = props.filterWrapper

  if (readOnly) {
    exceptionLabel.value = readOnly // Used to handle the cases we haven't seen yet
  } else if (filter) {
    currentOperation.value = operations.find(x => x.term.equals(filter.operation))
    args.value = filter.args
  }
})

const isNamed = computed(() => props.dimension.in && props.dimension.in.length > 0)

const currentArg = ref()
</script>

<template>
  <fieldset class="flex items-center gap-2">
    <template v-if="filterWrapper.readOnly">{{ exceptionLabel }}</template>
    <template v-else>

      <SelectBox :modelValue="currentOperation" @update:modelValue="updateOperation" :options="validOperations">
        <template v-slot:button="{ selected }">
          <span v-if="selected" :term="selected.term">{{ selected.label }}</span>
          <span v-else class="text-gray-500">Operation</span>
        </template>
      </SelectBox>

      <template v-if="currentOperation">
        <!--        MULTIPLE_NAMED-->
        <template v-if="isNamed && currentOperation.multipleValues">
          <SelectBoxMultiple :modelValue="args"
                             @update:modelValue="(terms)=>updateArgs({terms})"
                             :options="dimension.in">
            <template v-slot:button="{ selected }">
              <template v-if="selected">
                <span v-if="selected.length===0" class="text-gray-500">select</span>
                <term-display v-else-if="selected.length===1" :term="getDisplayTerm(selected[0])"/>
                <span v-else class="text-gray-500">({{ selected.length }}) items</span>
              </template>
              <span v-else class="text-gray-500">Value</span>
            </template>
            <template v-slot:option="{ option }">
              <term-display :term="getDisplayTerm(option)"/>
            </template>
          </SelectBoxMultiple>
        </template>
        <template v-else-if="isNamed && !currentOperation.multipleValues">
          <!--          SINGLE_NAMED-->
          <SelectBox :modelValue="currentArg"
                     @update:modelValue="(currentArg)=>updateArg({term:currentArg})"
                     :options="dimension.in">
            <template v-slot:button="{ selected }">
              <term-display v-if="selected" :term="getDisplayTerm(selected)"/>
              <span v-else class="text-gray-500">Value</span>
            </template>
            <template v-slot:option="{ option }">
              <term-display :term="getDisplayTerm(option)"/>
            </template>
          </SelectBox>
        </template>
        <template v-if="!isNamed">
          <term-input
            placeholder="Value"
            :modelValue="currentArg"
            @update:modelValue="(currentArg)=>updateArg({term:currentArg})"
            :datatype="dimension.datatype"
          />
        </template>
      </template>

    </template>
  </fieldset>
</template>
