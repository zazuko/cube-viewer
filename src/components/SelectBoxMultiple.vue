<script setup>
/* eslint-disable */
// https://headlessui.com/
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/solid'
import { defineEmits, defineProps, onMounted, ref } from 'vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    required: false
  }
})

</script>
<template>

  <Listbox multiple :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" as="div" class="relative">
    <ListboxButton class="button hover:bg-white pr-2">
      <slot name="button" :selected="modelValue">
        <span v-if="modelValue">{{ modelValue.map((x) => x.label ?? 'no-label').join(', ') }}</span>
        <span v-else class="text-gray-500">Select</span>
      </slot>
      <chevron-down-icon class="w-5 h-5 text-gray-500"/>
    </ListboxButton>
    <ListboxOptions
      class="absolute z-10 min-w-full border rounded-md shadow-md bg-white max-h-80 overflow-y-auto outline-none">
      <ListboxOption
        @click="(event)=>event.preventDefault()"
        v-for="(option, index) in options"
        :key="index"
        :value="option"
        as="template"
        v-slot="{ active, selected }"
      >
        <button class="w-full p-2 flex items-center gap-1" :class="{ 'bg-blue-50': active }">
          <check-icon class="w-5 h-5" :class="{ 'invisible': !selected }"/>
          <slot name="option" :option="option">{{ option.label ?? 'no-label' }}</slot>
        </button>
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
