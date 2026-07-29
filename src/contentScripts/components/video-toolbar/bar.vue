<template>
  <div
    class="btools-toolbar"
  >
    <div
      class="btools-toolbar__items"
      :class="itemsContainerClass"
      :aria-hidden="collapsed"
    >
      <component
        :is="b.href ? 'a' : 'button'"
        v-for="b in buttons"
        :key="b.key"
        class="btools-toolbar__btn"
        :class="[
          isDisabled(b) ? 'opacity-35 pointer-events-none' : '',
          cursorClass(b)
        ]"
        :href="b.href || undefined"
        :target="b.href ? '_blank' : undefined"
        :rel="b.href ? 'noopener noreferrer' : undefined"
        :type="b.href ? undefined : 'button'"
        :disabled="!b.href && isDisabled(b) ? true : undefined"
        :tabindex="(collapsed || isDisabled(b)) ? -1 : 0"
        :title="b.title"
        :aria-label="b.title"
        :aria-disabled="isDisabled(b) ? 'true' : undefined"
        @click="onItemClick(b, $event)"
      >
        <span :class="[iconClass(b), ICON_SPAN_CLASS]" />
      </component>
    </div>

    <button
      type="button"
      class="btools-toolbar__btn btools-toolbar__toggle"
      :aria-expanded="!collapsed"
      :title="toggleTitle"
      :aria-label="toggleTitle"
      @click="onToggleClick"
    >
      <span :class="[collapsed ? CHEVRON_LEFT : CHEVRON_RIGHT, ICON_SPAN_CLASS]" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ToolbarButton } from './types'
import { computed } from 'vue'

const props = defineProps<{
  buttons: ToolbarButton[]
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const CHEVRON_LEFT = 'btools-toolbar__icon--chevron-left'
const CHEVRON_RIGHT = 'btools-toolbar__icon--chevron-right'
const ICON_SPAN_CLASS = 'btools-toolbar__icon'

function iconClass(b: ToolbarButton): string {
  if (b.loading)
    return 'btools-toolbar__spinner'
  return b.icon === 'i-mdi-image-outline'
    ? 'btools-toolbar__icon--image'
    : b.icon
}

function isDisabled(b: ToolbarButton): boolean {
  return Boolean(b.disabled || b.loading)
}

// hover 走 CSS :hover（UnoCSS `hover:` variant）实现，不再用 ref + mouseenter/leave
// disabled 用 pointer-events-none 阻止 hover 触发，hover 类就不生效
// cursor 单独走函数只输出一个 cursor-* 类，避免多条 cursor 规则互相覆盖时的不确定性
function cursorClass(b: ToolbarButton): string {
  if (b.loading)
    return 'cursor-progress'
  if (b.disabled)
    return 'cursor-not-allowed'
  return 'cursor-pointer'
}

const itemsContainerClass = computed(() =>
  props.collapsed
    ? 'is-collapsed'
    : ''
)

function onItemClick(b: ToolbarButton, e: MouseEvent): void {
  if (isDisabled(b)) {
    e.preventDefault()
  }
  b.onClick?.(e)
}

function onToggleClick(): void {
  emit('toggle')
}

const toggleTitle = computed(() => (props.collapsed ? '展开 Btools 工具栏' : '收起 Btools 工具栏'))
</script>
