<template>
  <Dialog :open="isOpen" @close="$emit('close')" class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <dialog-overlay class="fixed inset-0 bg-black opacity-40" />

      <div class="z-10 max-w-full overflow-x-auto mx-auto bg-white rounded p-4">
        <dialog-title class="flex justify-between items-center gap-2 mb-2 font-bold">
          {{ title }}

          <button type="button" class="button-text" title="Close" @click="$emit('close')">
            <x-circle-icon class="h-6 w-6" />
          </button>
        </dialog-title>

        <table>
          <tr v-for="[predicate, objects] in properties" :key="predicate.value" class="align-top">
            <th class="pr-4 text-left font-semibold pb-2">
              <term-display :term="predicate" />
            </th>
            <td class="pb-2">
              <p v-for="(object, index) in objects" :key="index">
                <term-display v-if="object" :term="object" show-language />
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </Dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { Clownface } from 'clownface'
import { Dialog, DialogOverlay, DialogTitle } from '@headlessui/vue'
import { XCircleIcon } from '@heroicons/vue/outline'
import RDF from 'rdf-ext'
import TermDisplay from './TermDisplay.vue'

export default defineComponent({
  name: 'DimensionMetadata',
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
    TermDisplay,
    XCircleIcon,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    resource: {
      type: Clownface,
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],

  computed: {
    properties () {
      const pointer = this.resource
      const predicates = RDF.termSet([...pointer.dataset.match(pointer.term)].map(({ predicate }) => predicate))

      return [...predicates].map(predicate => [predicate, pointer.out(predicate).terms])
    },
  },
})
</script>
