<template>
  <div class="flex-grow flex items-center justify-end">
    <button @click="isOpen = true" title="Dimension Metadata">
      <information-circle-icon class="text-gray-500 w-5 h-5"/>
    </button>
    <resource-details-dialog
      :title="metadataTitle"
      :pointer="this.dimension.ptr"
      :is-open="isOpen"
      @close="isOpen = false"
    />
  </div>
</template>

<script>
/* eslint-disable */
import { defineComponent } from 'vue'
import { InformationCircleIcon } from '@heroicons/vue/outline'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'

export default defineComponent({
  name: 'DimensionMetadata',
  components: {
    InformationCircleIcon,
    ResourceDetailsDialog
  },
  props: {
    dimension: {
      type: Object,
      required: true
    },
    metadataTitle: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      isOpen: false
    }
  }
})
</script>
