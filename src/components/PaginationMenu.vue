<template>
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-1">
      <button @click="updatePage(1)" title="First page" class="button px-2" :disabled="page === 1">
        <chevron-double-left-icon class="w-6 h-6" />
      </button>
      <button @click="updatePage(page - 1)" title="Previous page" class="button px-2" :disabled="page === 1">
        <chevron-left-icon class="w-6 h-6" />
      </button>
      <input type="text" inputmode="numeric" :value="page" @change="updatePage($event.target.value)" class="w-14 text-right" />
      <button @click="updatePage(page + 1)" title="Next page" class="button px-2">
        <chevron-right-icon class="w-6 h-6" />
      </button>
    </div>

    <select :value="pageSize" @change="$emit('update:pageSize', Number($event.target.value))" title="Items per page">
      <option v-for="option in pageSizes" :key="option">{{ option }}</option>
    </select>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { ChevronDoubleLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/solid'

const pageSizes = ['10', '20', '50', '100']

export default defineComponent({
  name: 'PaginationMenu',
  components: { ChevronDoubleLeftIcon, ChevronLeftIcon, ChevronRightIcon },
  props: {
    page: {
      type: Number,
      required: true,
    },
    pageSize: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:page', 'update:pageSize'],

  setup () {
    return {
      pageSizes,
    }
  },

  methods: {
    updatePage (number) {
      const page = Number(number)

      if (!isNaN(page)) {
        this.$emit('update:page', page)
      }
    },
  },
})
</script>
