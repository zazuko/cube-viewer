<template>
  <span v-if="dataKind.term" :title="label" class="tag bg-primary-200">
    <component :is="icon" class="h-5 w-5" />
  </span>
</template>

<script>
import { defineComponent } from 'vue'
import { ClockIcon, LocationMarkerIcon, MapIcon, QuestionMarkCircleIcon } from '@heroicons/vue/outline'
import * as ns from '../namespace'

const labels = {
  [ns.time.GeneralDateTimeDescription.value]: 'Time description',
  [ns.schema.GeoCoordinates.value]: 'Geographic coordinates',
  [ns.schema.GeoShape.value]: 'Geographic shape',
}

const icons = {
  [ns.time.GeneralDateTimeDescription.value]: ClockIcon,
  [ns.schema.GeoCoordinates.value]: LocationMarkerIcon,
  [ns.schema.GeoShape.value]: MapIcon,
}

export default defineComponent({
  name: 'ScaleOfMeasureIcon',
  props: {
    dataKind: {
      required: true,
    },
  },

  computed: {
    dataKindType () {
      return this.dataKind.out(ns.rdf.type).term
    },

    label () {
      return labels[this.dataKindType.value] || this.dataKind.term.value
    },

    icon () {
      return icons[this.dataKindType.value] || QuestionMarkCircleIcon
    },
  },
})
</script>
