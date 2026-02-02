<template>
  <div v-if="cubes.isLoading" class="p-2 flex items-center gap-2">
    <loading-icon />
    Loading cubes...
  </div>
  <div v-else-if="cubes.error" class="p-2 text-red-500">
    {{ cubes.error }}
  </div>
  <Combobox v-else :modelValue="cubeUri" @update:modelValue="onSelect">
    <div class="relative w-full min-w-[500px]">
      <ComboboxInput
        class="w-full border border-gray-300 rounded px-3 py-1.5 pr-10 text-sm"
        :displayValue="(cube) => cube"
        @change="query = $event.target.value"
        placeholder="Search for a cube..."
      />
      <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          class="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </ComboboxButton>
      <ComboboxOptions
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div
          v-if="filteredCubes.length === 0 && query !== ''"
          class="relative cursor-default select-none py-2 px-4 text-gray-700"
        >
          No cubes found.
        </div>
        <ComboboxOption
          v-for="cube in filteredCubes"
          :key="cube.term.value"
          :value="cube.term.value"
          v-slot="{ active, selected }"
        >
          <li
            class="relative cursor-pointer select-none py-2 px-4"
            :class="{
              'bg-blue-600 text-white': active,
              'text-gray-900': !active,
            }"
          >
            <span
              :class="{ 'font-semibold': selected, 'font-normal': !selected }"
            >
              {{ cube.term.value }}
            </span>
            <span
              v-if="selected"
              class="absolute inset-y-0 right-0 flex items-center pr-4"
              :class="{ 'text-white': active, 'text-blue-600': !active }"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </li>
        </ComboboxOption>
      </ComboboxOptions>
    </div>
  </Combobox>
</template>

<script>
import { defineComponent, onMounted, ref, toRefs, watch, computed } from 'vue'
import { Cube, Source } from 'rdf-cube-view-query'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
import LoadingIcon from './icons/LoadingIcon.vue'
import * as Remote from '../remote'

export default defineComponent({
  name: 'CubeSelector',
  components: {
    LoadingIcon,
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
  },
  props: {
    source: {
      type: Source,
      required: true,
    },
    cubeUri: String,
  },
  emits: ['select'],

  setup (props) {
    const { source } = toRefs(props)
    const cubes = ref(Remote.loading())
    const query = ref('')

    const fetchCubes = async () => {
      cubes.value = Remote.loading()
      cubes.value = await Remote.fetch(async () =>
        source.value.cubes({
          noShape: true,
          filters: [Cube.filter.noValidThrough(), Cube.filter.noExpires()],
        })
      )
    }

    onMounted(fetchCubes)
    watch(source, fetchCubes)

    const filteredCubes = computed(() => {
      if (!cubes.value.data) return []
      if (query.value === '') return cubes.value.data

      return cubes.value.data.filter((cube) => {
        return cube.term.value
          .toLowerCase()
          .includes(query.value.toLowerCase())
      })
    })

    return {
      cubes,
      query,
      filteredCubes,
    }
  },

  methods: {
    onSelect (value) {
      this.$emit('select', value)
    },
  },
})
</script>
