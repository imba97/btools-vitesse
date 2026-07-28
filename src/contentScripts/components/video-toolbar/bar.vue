<template>
  <div
    class="btools-toolbar box-border h-full w-full flex items-center justify-end gap-1 py-2"
  >
    <div
      class="btools-toolbar__items flex items-center gap-1 overflow-hidden transition-[max-width,opacity] duration-150 ease"
      :class="itemsContainerClass"
      :aria-hidden="collapsed"
    >
      <component
        :is="b.href ? 'a' : 'button'"
        v-for="b in buttons"
        :key="b.key"
        class="btools-toolbar__btn h-6 w-6 flex flex-none items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit no-underline opacity-75 transition-[background-color,opacity] duration-150 ease hover:bg-[rgba(128,128,128,0.16)] hover:opacity-100"
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
      class="btools-toolbar__btn btools-toolbar__toggle h-6 w-6 flex flex-none cursor-pointer items-center justify-center rounded-md border-none bg-[rgba(128,128,128,0.08)] p-0 text-inherit no-underline opacity-75 transition-[background-color,opacity] duration-150 ease hover:bg-[rgba(128,128,128,0.16)] hover:opacity-100"
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

const CHEVRON_LEFT = 'i-mdi-chevron-left'
const CHEVRON_RIGHT = 'i-mdi-chevron-right'
const ICON_SPAN_CLASS = 'inline-block w-[1em] h-[1em]'

function iconClass(b: ToolbarButton): string {
  return b.loading ? 'i-eos-icons-loading' : b.icon
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
    ? 'max-w-0 opacity-0 pointer-events-none'
    : 'max-w-[320px] opacity-100'
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
