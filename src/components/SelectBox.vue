<template>
    <Listbox :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" as="div" class="relative">
      <ListboxButton class="button hover:bg-white pr-2">
        <slot name="button" :selected="modelValue">
          <span v-if="modelValue">{{ modelValue?.label }}</span>
          <span v-else class="text-gray-500">Select</span>
        </slot>
        <chevron-down-icon class="w-5 h-5 text-gray-500" />
      </ListboxButton>
      <ListboxOptions class="absolute z-10 min-w-full border rounded-md shadow-md bg-white max-h-80 overflow-y-auto outline-none">
        <ListboxOption
          v-for="(option, index) in options"
          @click="(event)=>event.preventDefault()"
          :key="index"
          :value="option"
          as="template"
          v-slot="{ active, selected }"
        >
          <button class="w-full p-2 flex items-center gap-1" :class="{ 'bg-blue-50': active }">
            <check-icon class="w-5 h-5" :class="{ 'invisible': !selected }" />
            <slot name="option" :option="option">{{ option.label }}</slot>
          </button>
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
</template>

<script>
import { defineComponent } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/solid'

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
