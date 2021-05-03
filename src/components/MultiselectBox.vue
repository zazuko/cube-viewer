<template>
    <Listbox :modelValue="modelValue" @update:modelValue="onSelect" as="div" class="relative">
      <ListboxButton class="button pr-2">
        <slot name="button" :selected="modelValue">
          <span v-for="(value, index) in modelValue" :key="index">
            {{ modelValue?.label }}
          </span>
          <span v-if="modelValue.length === 0" class="text-gray-500">Select</span>
        </slot>
        <chevron-down-icon class="w-5 h-5 text-gray-500" />
      </ListboxButton>
      <ListboxOptions class="absolute min-w-full border rounded-md shadow-md bg-white max-h-80 overflow-y-auto outline-none">
        <ListboxOption
          v-for="(option, index) in options"
          :key="index"
          :value="option"
          as="template"
          v-slot="{ active }"
        >
          <button class="w-full p-2 flex items-center gap-1" :class="{ 'bg-blue-50': active }">
            <check-icon class="w-5 h-5" :class="{ 'invisible': !isSelected(option) }" />
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

  methods: {
    isSelected (option) {
      return this.modelValue.find((item) => item === option)
    },

    onSelect (option) {
      let newValue = this.modelValue

      if (!this.isSelected(option)) {
        newValue = [...this.modelValue, option]
      } else {
        newValue = this.modelValue.filter((item) => item !== option)
      }

      this.$emit('update:modelValue', newValue)
    },
  },
})
</script>
