<template>
  <div>
    <h2 class="mb-4 whitespace-nowrap">
      <a :href="uri.value" target="_blank" rel="noopener" class="group flex items-center gap-1">
        {{ uri.value }}
        <external-link-icon class="w-4 h-4 invisible group-hover:visible" />
      </a>
    </h2>
    <loading-icon v-if="resource.isLoading" />
    <section v-else-if="resource.error" class="text-red-500">
      <h3 class="font-bold">Could not load resource</h3>
      {{ resource.error }}
    </section>
    <table v-else>
      <tr v-for="([predicate, objects], index) in properties" :key="index" class="align-top">
        <td class="py-2 pr-4 font-semibold">
          <term-display :term="predicate" :base="cube.term.value" />
        </td>
        <td class="py-2 flex flex-col gap-1">
          <p v-for="(object, objectIndex) in objects" :key="objectIndex">
            <observation-value :value="object" :cube="cube" />
          </p>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { defineAsyncComponent, defineComponent, ref, toRefs, onMounted, watch } from 'vue'
import { ExternalLinkIcon } from '@heroicons/vue/solid'
import { Term } from '@rdfjs/data-model'
import fetchRDF from '@rdfjs/fetch'
import TermSet from '@rdfjs/term-set'
import clownface from 'clownface'
import { Cube } from 'rdf-cube-view-query'
import LoadingIcon from './icons/LoadingIcon.vue'
import TermDisplay from './TermDisplay.vue'
import * as Remote from '../remote'

export default defineComponent({
  name: 'ResourceDetails',
  components: {
    ExternalLinkIcon,
    LoadingIcon,
    ObservationValue: defineAsyncComponent(() => import('./ObservationValue.vue')),
    TermDisplay,
  },
  props: {
    uri: {
      type: Term,
      required: true,
    },
    cube: {
      type: Cube,
      required: true,
    },
  },

  setup (props) {
    const { uri } = toRefs(props)

    const resource = ref(Remote.loading())
    const fetchResource = async () => {
      const term = uri.value

      try {
        const response = await fetchRDF(term.value)

        if (response.status === 200) {
          const dataset = await response.dataset()

          resource.value = Remote.loaded(clownface({ dataset, term }))
        } else {
          throw new Error(`${response.status}`)
        }
      } catch (e) {
        resource.value = Remote.error(e.message)
      }
    }
    onMounted(fetchResource)
    watch(uri, fetchResource)

    return {
      resource,
    }
  },

  computed: {
    properties () {
      const resource = this.resource.data

      if (!resource) return []

      const resourceQuads = [...resource.dataset.match(resource.term, null, null)]
      const resourcePredicates = new TermSet(resourceQuads.map(({ predicate }) => predicate))

      return [...resourcePredicates].map((predicate) => {
        const values = resource.out(predicate).terms

        return [predicate, values]
      })
    },
  },
})
</script>
