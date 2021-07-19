<template>
  <div class="flex-grow flex items-center justify-end">
    <button @click="isOpen = true" title="Dimension Metadata">
      <information-circle-icon class="text-gray-500 w-5 h-5" />
    </button>
    <resource-details-dialog
      title="Dimension Metadata"
      :resource="this.dimension.ptr"
      :is-open="isOpen"
      @close="isOpen = false"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import { InformationCircleIcon } from '@heroicons/vue/outline'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'

export default defineComponent({
  name: 'DimensionMetadata',
  components: {
    InformationCircleIcon,
    ResourceDetailsDialog,
  },
  props: {
    dimension: {
      type: CubeDimension,
      required: true,
    },
  },

  data () {
    return {
      isOpen: false,
    }
  },
})
</script>
