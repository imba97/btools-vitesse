<template>
  <div absolute>
    <Component :is="component" v-for="(component, name) in components" :key="name" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import 'uno.css'

const modules = import.meta.glob<{ default: Component }>('../components/*.vue')
const components = shallowRef<Record<string, Component>>({})

onMounted(async () => {
  const loadedComponents = await Promise.all(
    Object.keys(modules).map(async (path) => {
      const name = path.split('/').pop()?.replace('.vue', '')
      if (!name)
        return null
      const mod = await modules[path]!()
      return [name, mod.default] as const
    })
  )

  components.value = loadedComponents.reduce<Record<string, Component>>((acc, current) => {
    if (current) {
      const [name, component] = current
      acc[name] = component
    }
    return acc
  }, {})
})
</script>
