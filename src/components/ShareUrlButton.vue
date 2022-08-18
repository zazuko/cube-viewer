<script setup>
/* eslint-disable */
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ShareIcon } from '@heroicons/vue/solid'
import { useClipboard } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const source = ref()
const {
  text,
  copy,
  copied,
  isSupported
} = useClipboard({ source })

onMounted(() => {
  source.value = new URL(window.location.href)
})

async function copyURL () {
  const shortenerUrl = new URL('https://s.zazuko.com/api/v1/shorten/')
  shortenerUrl.searchParams.set('url', window.location.href)
  const response = await fetch(shortenerUrl.toString())
  source.value = await response.text()
  await copy()
}

</script>

<template>

  <Popover class="relative">
    <PopoverButton class="button" title="Share" @click='copyURL()'>
      <share-icon class="w-5 h-5"/>
    </PopoverButton>
    <span v-if='!copied'>Copy</span>
    <span v-else>Copied!</span>
    <PopoverPanel v-if="copied" class="absolute right-0 z-10 border bg-white p-2">
      <span class="text-sm text-green-500">
        Copied to clipboard
      </span>
    </PopoverPanel>
  </Popover>
</template>
