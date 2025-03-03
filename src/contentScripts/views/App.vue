<template>
  <div class="fixed bottom-0 right-0 z-100 m-5 flex select-none items-end leading-1em font-sans">
    <div
      v-show="show"
      class="h-min w-max rounded-lg bg-white text-gray-800 shadow"
      p="x-4 y-2"
      m="y-auto r-2"
      transition="opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      <h1 class="text-lg">
        Vitesse WebExt
      </h1>
      <SharedSubtitle />
    </div>
    <button
      class="h-10 w-10 flex cursor-pointer rounded-full border-none shadow"
      bg="teal-600 hover:teal-700"
      @click="toggle()"
    >
      <pixelarticons-power class="m-auto block text-lg text-white" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import 'uno.css'

const [show, toggle] = useToggle(false)
</script>
