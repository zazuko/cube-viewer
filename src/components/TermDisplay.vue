<template>
  <span :title="expanded">
    {{ shrunk }}
    <span v-if="showLanguage && term.language" class="text-gray-400">@{{ term.language }}</span>
  </span>
</template>

<script>
import { defineComponent } from 'vue'
import { Term } from '@rdfjs/data-model'
import * as ns from '../namespace'

export default defineComponent({
  name: 'TermDisplay',
  props: {
    term: {
      type: Term,
      required: true,
    },
    showLanguage: {
      type: Boolean,
      default: false,
    },
    base: String,
  },

  computed: {
    shrunk () {
      if (this.term.termType === 'NamedNode' && this.base) {
        const result = ns.shrink(this.term.value, this.base)
        if (result === this.term.value) { // If the term was not modified, try again with a shorter base
          return ns.shrink(this.term.value, this.base.split('/').splice(0, this.base.split('/').length - 1).join('/'))
        }
        return result
      } else {
        return this.term.value
      }
    },

    expanded () {
      if (this.term.termType === 'Literal') {
        const datatype = this.term.datatype ? `^^${ns.shrink(this.term.datatype.value)}` : ''
        const language = this.term.language ? `@${this.term.language}` : ''

        return `"${this.term.value}${language}"${datatype}`
      } else {
        return this.term.value
      }
    },
  },
})
</script>
