<template>
  <div absolute>
    <Component :is="component" v-for="(component, name) in components" :key="name" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import 'uno.css'

const modules = import.meta.glob<{ default: Component }>('../components/*.vue', { eager: true })

const components = Object.entries(modules).reduce<Record<string, Component>>((acc, [key, value]) => {
  const name = key.split('/').pop()?.replace('.vue', '')
  if (name) {
    acc[name] = value.default
  }
  return acc
}, {})
</script>
