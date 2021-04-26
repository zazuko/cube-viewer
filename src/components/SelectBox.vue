<template>
    <Listbox :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" as="div" class="relative">
      <ListboxButton class="button hover:bg-white pr-2">
        <slot name="button" :selected="modelValue">
          <span v-if="modelValue">{{ modelValue?.label }}</span>
          <span v-else class="text-gray-500">Select</span>
        </slot>
        <chevron-down-icon class="text-gray-500" />
      </ListboxButton>
      <ListboxOptions class="absolute min-w-full border rounded-md shadow-md bg-white max-h-80 overflow-y-auto outline-none">
        <ListboxOption
          v-for="(option, index) in options"
          :key="index"
          :value="option"
          as="template"
          v-slot="{ active, selected }"
        >
          <button class="w-full p-2 flex items-center gap-1" :class="{ 'bg-blue-50': active }">
            <CheckIcon :class="{ 'invisible': !selected }" />
            <slot name="option" :option="option">{{ option.label }}</slot>
          </button>
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
</template>

<script>
import { defineComponent } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import CheckIcon from './icons/CheckIcon.vue'
import ChevronDownIcon from './icons/ChevronDownIcon.vue'

export default defineComponent({
  name: 'SelectBox',
  components: { CheckIcon, ChevronDownIcon, Listbox, ListboxButton, ListboxOptions, ListboxOption },
  props: {
    options: {
      type: Array,
      required: true,
    },
    modelValue: {
    },
  },
  emits: ['update:modelValue'],
})
</script>
