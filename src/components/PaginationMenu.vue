/* eslint-disable */
<template>
  <div class="flex items-center gap-8">
    <div class="flex items-center gap-1">
      <button @click="updatePage(1)" title="First page" class="button px-2" :disabled="page === 1">
        <chevron-double-left-icon class="w-6 h-6" />
      </button>
      <button @click="updatePage(page - 1)" title="Previous page" class="button px-2" :disabled="page === 1">
        <chevron-left-icon class="w-6 h-6" />
      </button>

      <span>Page </span>
      <input type="text" inputmode="numeric" :value="page" @change="updatePage($event.target.value)" class="w-14 text-right" />
      <span> of </span>
      <loading-icon v-if="itemsCount.isLoading" />
      <span v-else-if="itemsCount.error" class="text-red-500" :title="itemsCount.error">
        <exclamation-circle-icon class="w-5 h-5" />
      </span>
      <span v-else>{{ pagesCount }}</span>
      <button @click="updatePage(page + 1)" title="Next page" class="button px-2" :disabled="!pagesCount || page >= pagesCount">
        <chevron-right-icon class="w-6 h-6" />
      </button>
      <button @click="updatePage(pagesCount)" title="Last page" class="button px-2" :disabled="!pagesCount || page >= pagesCount">
        <chevron-double-right-icon class="w-6 h-6" />
      </button>
    </div>

    <select :value="pageSize" @change="$emit('update:pageSize', Number($event.target.value))" title="Items per page">
      <option v-for="option in pageSizes" :key="option">{{ option }}</option>
    </select>
  </div>
</template>

<script>
import { computed, defineComponent, toRefs } from 'vue'
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/solid'
import { ExclamationCircleIcon } from '@heroicons/vue/outline'
import LoadingIcon from './icons/LoadingIcon.vue'

const pageSizes = ['10', '20', '50', '100']

export default defineComponent({
  name: 'PaginationMenu',
  components: { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon, ExclamationCircleIcon, LoadingIcon },
  props: {
    page: {
      type: Number,
      required: true,
    },
    pageSize: {
      type: Number,
      required: true,
    },
    itemsCount: {
      // type: Remote<Number>,
      type: Object,
      required: true,
    },
  },
  emits: ['update:page', 'update:pageSize'],

  setup (props) {
    const { itemsCount, pageSize } = toRefs(props)

    const pagesCount = computed(() => {
      if (itemsCount.value.isLoading || itemsCount.value.error) return null

      return Math.ceil(itemsCount.value.data / pageSize.value)
    })

    return {
      pagesCount,
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
