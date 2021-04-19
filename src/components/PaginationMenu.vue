<template>
  <div class="flex items-center gap-6">
    <div class="flex items-center gap-4">
      <button @click="$emit('update:page', page - 1)" title="Previous" class="button px-2" :disabled="page === 1">
        <chevron-left-icon />
      </button>
      {{ page }}
      <button @click="$emit('update:page', page + 1)" title="Next" class="button px-2">
        <chevron-right-icon />
      </button>
    </div>

    <select :value="pageSize" @change="$emit('update:pageSize', Number($event.target.value))" title="Items per page">
      <option v-for="option in pageSizes" :key="option">{{ option }}</option>
    </select>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ChevronLeftIcon from './icons/ChevronLeftIcon.vue'
import ChevronRightIcon from './icons/ChevronRightIcon.vue'

const pageSizes = ['10', '20', '50', '100']

export default defineComponent({
  name: 'PaginationMenu',
  components: { ChevronLeftIcon, ChevronRightIcon },
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
})
</script>
