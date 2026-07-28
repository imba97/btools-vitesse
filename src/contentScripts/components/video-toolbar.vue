<template>
  <!--
    Teleport 把 VideoToolbarBar 渲染到 hostEl（B 站 main DOM 里），
    host 不存在时 v-if 不渲染 Teleport，也就不渲染 bar。
  -->
  <Teleport
    v-if="hostEl"
    :to="hostEl"
    :disabled="!hostEl"
  >
    <VideoToolbarBar
      :buttons="buttons"
      :collapsed="collapsed"
      @toggle="toggle"
    />
  </Teleport>
</template>

<script setup lang="ts">
import type { ToolbarButton } from './video-toolbar/types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useHostMount } from '~/composables/useHostMount'
import { usePanelCollapse } from '~/composables/usePanelCollapse'
import { extractBvid, isVideoPage } from '../utils/bilibili-url'
import { getVideoCover } from '../utils/video-cover'
import VideoToolbarBar from './video-toolbar/bar.vue'

/*
  B 站视频页扩展 bar（headless 父组件）。

  这里只做「装载 + 状态机」的工作：
  - 找到 #arc_toolbar_report，并在它**前一个 sibling** 位置创建 host div；
  - 维护 collapsed / coverUrl / status 等响应式状态；
  - MO 兜底恢复 host 位置；
  - 用 <Teleport> 把 VideoToolbarBar 渲染到 host 里。

  host 的外观（layout / theme / 边框）全部通过 UnoCSS class 一次性挂上，
  主题切换走 CSS `prefers-color-scheme` 媒体查询（`dark:` variant），不再 JS 监听。
  bar 的结构、hover 都在 VideoToolbarBar 里走 template + UnoCSS class + :style。

  关于防御策略：
  - 不再 monkey-patch Node.prototype.removeChild / insertBefore。
  - content script 在 isolated world，B 站 MAIN world 的 Vue 2 patch / jQuery / 业务
    代码看不到也不会调我们的 prototype，而且隔离了 prototype 反而会被 B 站自己
    的 patch 在同 realm 内相互嵌套导致未知 bug。
  - host 真被 B 站移除时，由 MO 监听到并 mountHost() 重建；这才是真正能动的 hook。
*/

const PANEL_KEY = 'video-toolbar'
const HOST_ID = 'btools-bar-host'
// host 视觉：layout 一次性固定；theme 走 `dark:` variant 媒体查询（uno.config.ts dark: 'media'）
const HOST_LAYOUT_CLASS = 'flex items-center justify-end h-8 w-full box-border py-1 px-3 text-[canvastext] text-base leading-none select-none backdrop-blur'
const HOST_THEME_CLASS = 'bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(31,32,35,0.92)] border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]'
const HOST_CLASS = `${HOST_LAYOUT_CLASS} ${HOST_THEME_CLASS}`

// —— host 元素（B 站 light tree 里，arc_toolbar_report 前一个 sibling） ——
const { hostEl, mount: mountHost, unmount: unmountHost } = useHostMount(
  '#arc_toolbar_report',
  { id: HOST_ID, className: HOST_CLASS }
)

// —— bar 数据 + 状态机 ——
const { collapsed, toggle } = usePanelCollapse(PANEL_KEY, true)
const bvid = ref<string | null>(null)
const coverUrl = ref<string | null>(null)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

const cleanupTasks: Array<() => void> = []
let disposed = false

const coverTitle = computed(() => {
  switch (status.value) {
    case 'loading': return '封面获取中…'
    case 'error': return '封面获取失败，点击重试'
    default: return '打开封面'
  }
})

function retryCover(): void {
  if (status.value === 'error') {
    void loadCover()
  }
}

const buttons = computed<ToolbarButton[]>(() => [
  {
    key: 'cover',
    icon: 'i-mdi-image-outline',
    title: coverTitle.value,
    href: coverUrl.value,
    loading: status.value === 'loading',
    // idle / loading 状态都按 disabled 处理（loading 期间禁用避免重复点击，error 时启用允许重试）
    disabled: status.value === 'idle' || status.value === 'loading',
    onClick: retryCover
  }
])

async function loadCover(): Promise<void> {
  const target = bvid.value
  if (!target) {
    return
  }
  status.value = 'loading'
  try {
    const url = await getVideoCover(target)
    if (disposed || bvid.value !== target) {
      return
    }
    coverUrl.value = url
    status.value = url ? 'ready' : 'error'
  }
  catch {
    if (disposed || bvid.value !== target) {
      return
    }
    coverUrl.value = null
    status.value = 'error'
  }
}

function syncBvid(): void {
  const next = isVideoPage() ? extractBvid(location.href) : null
  if (next !== bvid.value) {
    bvid.value = next
    coverUrl.value = null
    status.value = 'idle'
  }
}

watch(() => isVideoPage(), () => syncBvid(), { immediate: true })

watch(
  [collapsed, bvid],
  () => {
    if (!collapsed.value && bvid.value && status.value === 'idle') {
      void loadCover()
    }
  },
  { immediate: true }
)

// —— 生命周期：MO / popstate ——
onMounted(() => {
  mountHost()

  // 兜底：B 站 MAIN world 的 Vue 2 patch / jQuery / 业务代码可能整体替换
  // #arc_toolbar_report 的父容器，导致 host 被丢弃。下一帧校验位置，
  // 不在 [parent, prevSibling=arc_toolbar_report] 就 mountHost() 重建。
  let moScheduled = false
  const scheduleCheck = (): void => {
    if (moScheduled || disposed) {
      return
    }
    moScheduled = true
    queueMicrotask(() => {
      moScheduled = false
      try {
        const toolbar = document.querySelector<HTMLElement>('#arc_toolbar_report')
        if (!toolbar) {
          unmountHost()
          return
        }
        const inPlace = !!hostEl.value
          && hostEl.value.parentElement === toolbar.parentElement
          && hostEl.value.nextElementSibling === toolbar
        if (!inPlace) {
          mountHost()
        }
      }
      catch {
        // 静默吞掉，下一帧 MO 会重新触发 scheduleCheck
      }
    })
  }
  const mo = new MutationObserver(scheduleCheck)
  mo.observe(document.body, { childList: true, subtree: true })
  cleanupTasks.push(() => mo.disconnect())

  const onPop = () => {
    syncBvid()
    if (!hostEl.value?.parentElement) {
      mountHost()
    }
  }
  window.addEventListener('popstate', onPop)
  cleanupTasks.push(() => window.removeEventListener('popstate', onPop))
})

onUnmounted(() => {
  disposed = true
  while (cleanupTasks.length) {
    cleanupTasks.pop()?.()
  }
  // useHostMount 自带 onUnmounted(unmount)，这里不再重复调用
})
</script>
