<template>
  <Dialog :open="isOpen" @close="$emit('close')" class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <dialog-overlay class="fixed inset-0 bg-black opacity-40" />

      <div class="z-10 max-w-full overflow-x-auto mx-auto bg-white rounded p-4">
        <dialog-title class="flex justify-between items-center gap-2 mb-2 font-bold">
          <!-- Resource Explorer -->

          <button type="button" class="button-text" title="Close" @click="$emit('close')">
            <x-circle-icon class="h-6 w-6" />
          </button>
        </dialog-title>

        <resource-details :uri="uri" :clownface="clownface" />
      </div>
    </div>
  </Dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { Dialog, DialogOverlay, DialogTitle } from '@headlessui/vue'
import { XCircleIcon } from '@heroicons/vue/outline'
import { Term } from '@rdfjs/data-model'
import ResourceDetails from './ResourceDetails.vue'

export default defineComponent({
  name: 'ResourceExplorer',
  components: { Dialog, DialogOverlay, DialogTitle, ResourceDetails, XCircleIcon },
  props: {
    isOpen: { type: Boolean, required: true },
    uri: { type: Term, required: true },
    clownface: { type: Object, required: true },
  },
  emits: ['close'],
})
</script>
