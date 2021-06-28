<template>
  <div class="flex-grow flex items-center justify-end">
    <button @click="isOpen = true">
      <information-circle-icon class="text-gray-500 w-5 h-5" />
    </button>
    <Dialog :open="isOpen" @close="isOpen = false" class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <dialog-overlay class="fixed inset-0 bg-black opacity-40" />

        <div class="z-10 max-w-full overflow-x-auto mx-auto bg-white rounded p-4">
          <dialog-title class="flex justify-between items-center gap-2 mb-2 font-bold">
            Dimension metadata

            <button type="button" class="button-text" title="Close" @click="isOpen = false">
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
  </div>
</template>

<script>
import TermSet from '@rdfjs/term-set'
import { defineComponent } from 'vue'
import { CubeDimension } from 'rdf-cube-view-query'
import { Dialog, DialogOverlay, DialogTitle } from '@headlessui/vue'
import { InformationCircleIcon, XCircleIcon } from '@heroicons/vue/outline'
import TermDisplay from './TermDisplay.vue'

export default defineComponent({
  name: 'DimensionMetadata',
  components: {
    InformationCircleIcon,
    Dialog,
    DialogOverlay,
    DialogTitle,
    TermDisplay,
    XCircleIcon,
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

  computed: {
    properties () {
      const predicates = new TermSet([...this.dimension.ptr.dataset.match(this.dimension.ptr.term)].map(({ predicate }) => predicate))

      const x = [...predicates].map(predicate => [predicate, this.dimension.out(predicate).terms])
      console.log(x)
      return x
    },
  },
})
</script>
