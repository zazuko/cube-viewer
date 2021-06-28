<template>
  <Popover class="relative">
    <PopoverButton class="button" title="Share">
      <share-icon class="w-5 h-5" />
    </PopoverButton>

    <PopoverPanel class="absolute right-0 z-10 border bg-white p-2">
      <input type="text" ref="urlInput" :value="shareUrl" readonly @focus="copyShareUrl" />
      <span v-show="isCopied" class="text-sm text-green-500">
        Copied to clipboard
      </span>
    </PopoverPanel>
  </Popover>
</template>

<script>
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ShareIcon } from '@heroicons/vue/solid'
import { Source } from 'rdf-cube-view-query'

export default defineComponent({
  name: 'ShareUrlButton',
  components: {
    Popover,
    PopoverButton,
    PopoverPanel,
    ShareIcon,
  },
  props: {
    source: {
      type: Source,
      required: true,
    },
    cubeUri: {
      type: String,
      required: true,
    },
  },

  setup (props) {
    const { cubeUri, source } = toRefs(props)

    const shareUrl = ref('')
    const setUrl = () => {
      const url = new URL(window.location.href)
      url.searchParams.set('cube', cubeUri.value ?? '')
      url.searchParams.set('endpointUrl', source.value.endpoint?.value ?? '')
      url.searchParams.set('user', source.value.user ?? '')
      url.searchParams.set('password', source.value.password ?? '')
      url.searchParams.set('sourceGraph', source.value.graph?.value ?? '')

      shareUrl.value = url.toString()
    }
    onMounted(setUrl)
    watch(cubeUri, setUrl)

    const isCopied = ref(false)
    const copyShareUrl = async () => {
      await navigator.clipboard.writeText(shareUrl.value)
      isCopied.value = true
      setTimeout(resetCopied, 2000)
    }
    const resetCopied = () => {
      isCopied.value = false
    }

    return {
      shareUrl,
      isCopied,
      copyShareUrl,
      resetCopied,
    }
  },
})
</script>
