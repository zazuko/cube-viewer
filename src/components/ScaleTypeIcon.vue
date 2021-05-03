<template>
  <span v-if="scaleOfMeasure.term" :title="label" class="tag bg-primary-200">
    <component :is="icon" class="h-5 w-5" />
  </span>
</template>

<script>
import { defineComponent } from 'vue'
import { PresentationChartLineIcon, QuestionMarkCircleIcon, ScaleIcon, ViewListIcon } from '@heroicons/vue/outline'
import { ViewGridIcon } from '@heroicons/vue/solid'
import * as ns from '../namespace'

const icons = {
  [ns.qudt.NominalScale.value]: ViewGridIcon,
  [ns.qudt.OrdinalScale.value]: ViewListIcon,
  [ns.qudt.IntervalScale.value]: PresentationChartLineIcon,
  [ns.qudt.RatioScale.value]: ScaleIcon,
}

export default defineComponent({
  name: 'ScaleOfMeasureIcon',
  props: {
    scaleOfMeasure: {
      required: true,
    },
  },

  computed: {
    label () {
      return this.scaleOfMeasure?.value.split('/').slice(-1)[0] ?? ''
    },

    icon () {
      const scaleOfMeasure = this.scaleOfMeasure?.value ?? ''

      return icons[scaleOfMeasure] || QuestionMarkCircleIcon
    },
  },
})
</script>
