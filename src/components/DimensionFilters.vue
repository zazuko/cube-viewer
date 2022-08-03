<template>
  <form @submit.prevent="submit" class="">
    <div class="mb-4 flex flex-col gap-2">
      <dimension-filter
        v-for="(filter, index) in filtersData"
        :key="index"
        :dimension="dimension"
        :language="language"
        :labels="labels"
        v-model:filter="filter.value"
      />
      <button type="button" @click="addFilter" class="button-text justify-end">
        <plus-icon class="w-5 h-5" />
        Add filter
      </button>
    </div>
    <button type="submit" class="button-primary self-end">
      Apply filters
    </button>
  </form>
</template>

<script>
import { defineComponent, ref, toRefs } from 'vue'
import { PlusIcon } from '@heroicons/vue/solid'
import { CubeDimension } from 'rdf-cube-view-query'
import DimensionFilter from './DimensionFilter.vue'

export default defineComponent({
  name: 'DimensionFilters',
  components: { DimensionFilter, PlusIcon },
  props: {
    dimension: {
      type: CubeDimension,
      required: true,
    },
    filters: {
      type: Array,
      required: true,
    },
    labels: {
      type: Object,
      required: false,
    },
    language: {
      type: [String, Array],
      required: false,
    },
  },
  emits: ['update:filters'],

  setup (props) {
    const { filters } = toRefs(props)

    // Filters are nested in `[].value` because Vue doesn't like it when we
    // use items of a v-for loop as v-model
    const filtersData = ref(filters.value.map(filter => ({ value: filter })))

    return {
      filtersData,
    }
  },

  methods: {
    submit () {
      const filters = this.filtersData
        .map(({ value }) => value)
        .filter(({ operation, arg }) => operation && arg)

      this.$emit('update:filters', filters)
    },

    addFilter () {
      this.filtersData.push({
        value: {
          dimension: this.dimension,
          operation: null,
          arg: null,
        },
      })
    },
  },
})
</script>
