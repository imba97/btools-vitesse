<style scoped>
.btools-open-cover-panel {
  opacity: 0;
  pointer-events: auto;
  transition:
    opacity 220ms ease;
}

.btools-open-cover-panel.is-visible,
.btools-open-cover-panel:hover {
  opacity: 1;
}

.btools-open-cover-button {
  transition:
    background-color 180ms ease,
    color 180ms ease;
}
</style>

<template>
  <div
    ref="playerPanelRef"
    class="btools-open-cover-panel fixed z-[9999999] flex flex-col gap-2"
    :class="{ 'is-visible': showPlayerPanel }"
    :style="playerPanelStyle"
    @mouseenter="showPlayerEntry"
    @mouseleave="hidePlayerEntryFromPanel"
  >
    <button
      type="button"
      title="打开封面"
      class="btools-open-cover-button h-7 w-7 flex cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-primary shadow-none outline-none transition-colors hover:bg-primary/15"
      @click="openPlayerCover"
    >
      <i class="i-material-symbols-imagesmode-outline-rounded size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePageWorld } from '../composables/usePageWorld'

const LOG_PREFIX = '[btools:open-image]'
const PLAYER_PANEL_HIDE_DELAY_MS = 220

const cleanupTasks: Array<() => void> = []
const showPlayerPanel = ref(false)
const playerPanelRef = ref<HTMLElement | null>(null)
const playerWrapRef = shallowRef<HTMLElement | null>(null)
const playerPanelStyle = reactive({
  top: '8px',
  left: '8px'
})
const { getWindow } = usePageWorld()

let hideTimer: number | undefined

function openCover(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function openPlayerCover() {
  try {
    const data = await getWindow('video-cover')
    openCover(data.url)
  }
  catch (error) {
    console.warn(`${LOG_PREFIX} open player cover failed`, error)
  }
}

async function openLiveCover() {
  try {
    const data = await getWindow('live-cover')
    openCover(data.url)
  }
  catch (error) {
    console.warn(`${LOG_PREFIX} open live cover failed`, error)
  }
}

function createIconButton(onClick: () => void | Promise<void>): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.title = '打开封面'
  button.className = 'btools-open-cover-button h-7 w-7 flex items-center justify-center cursor-pointer border-none rounded-md bg-transparent text-primary shadow-none outline-none transition-colors hover:bg-primary/15'

  const icon = document.createElement('i')
  icon.className = 'i-material-symbols-imagesmode-outline-rounded size-4'
  button.appendChild(icon)

  const handler = () => {
    void onClick()
  }

  button.addEventListener('click', handler)
  cleanupTasks.push(() => button.removeEventListener('click', handler))

  return button
}

function updatePlayerPanelPosition(): void {
  const playerWrap = playerWrapRef.value
  if (!playerWrap)
    return

  const rect = playerWrap.getBoundingClientRect()
  const panelWidth = playerPanelRef.value?.getBoundingClientRect().width || 28
  playerPanelStyle.top = `${Math.max(rect.top + 10, 8)}px`
  playerPanelStyle.left = `${Math.max(rect.left - panelWidth - 10, 8)}px`
}

function showPlayerEntry(): void {
  if (hideTimer !== undefined) {
    window.clearTimeout(hideTimer)
    hideTimer = undefined
  }

  showPlayerPanel.value = true
  void nextTick(() => {
    updatePlayerPanelPosition()
  })
}

function hidePlayerEntryImmediately(): void {
  showPlayerPanel.value = false
}

function scheduleHidePlayerEntry(): void {
  if (hideTimer !== undefined)
    window.clearTimeout(hideTimer)

  hideTimer = window.setTimeout(() => {
    hideTimer = undefined
    hidePlayerEntryImmediately()
  }, PLAYER_PANEL_HIDE_DELAY_MS)
}

function hidePlayerEntryFromPanel(event: MouseEvent): void {
  const playerWrap = playerWrapRef.value
  const nextElement = event.relatedTarget as Node | null
  if (playerWrap && nextElement && playerWrap.contains(nextElement))
    return
  scheduleHidePlayerEntry()
}

function hidePlayerEntryFromHost(event: MouseEvent): void {
  const panel = playerPanelRef.value
  const nextElement = event.relatedTarget as Node | null
  if (panel && nextElement && panel.contains(nextElement))
    return
  scheduleHidePlayerEntry()
}

function mountPlayerWrapEntry(): boolean {
  const playerWrap = document.querySelector<HTMLElement>('#playerWrap')
  if (!playerWrap)
    return false

  if (playerWrapRef.value)
    return true

  playerWrapRef.value = playerWrap

  const onWindowChanged = () => {
    if (showPlayerPanel.value)
      updatePlayerPanelPosition()
  }

  let frameId = 0
  let lastRect = playerWrap.getBoundingClientRect()
  const trackHostRect = () => {
    const nextRect = playerWrap.getBoundingClientRect()
    if (
      nextRect.top !== lastRect.top
      || nextRect.left !== lastRect.left
      || nextRect.width !== lastRect.width
      || nextRect.height !== lastRect.height
    ) {
      lastRect = nextRect
      if (showPlayerPanel.value)
        updatePlayerPanelPosition()
    }
    frameId = window.requestAnimationFrame(trackHostRect)
  }

  const resizeObserver = new ResizeObserver(() => {
    if (showPlayerPanel.value)
      updatePlayerPanelPosition()
  })
  resizeObserver.observe(playerWrap)
  frameId = window.requestAnimationFrame(trackHostRect)

  playerWrap.addEventListener('mouseenter', showPlayerEntry)
  playerWrap.addEventListener('mouseleave', hidePlayerEntryFromHost)
  window.addEventListener('resize', onWindowChanged)
  window.addEventListener('scroll', onWindowChanged, true)

  cleanupTasks.push(() => {
    playerWrap.removeEventListener('mouseenter', showPlayerEntry)
    playerWrap.removeEventListener('mouseleave', hidePlayerEntryFromHost)
    window.removeEventListener('resize', onWindowChanged)
    window.removeEventListener('scroll', onWindowChanged, true)
    resizeObserver.disconnect()
    window.cancelAnimationFrame(frameId)
    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer)
      hideTimer = undefined
    }
    showPlayerPanel.value = false
    playerWrapRef.value = null
  })

  return true
}

function mountLiveRoomEntry(): boolean {
  const mountPoint = document.querySelector<HTMLElement>('.supporting-info .live-skin-coloration-area')
  if (!mountPoint)
    return false

  if (mountPoint.querySelector('.btools-live-open-cover-button'))
    return true

  const originPosition = mountPoint.style.position
  if (window.getComputedStyle(mountPoint).position === 'static')
    mountPoint.style.position = 'relative'

  const button = createIconButton(openLiveCover)
  button.classList.add('btools-live-open-cover-button')
  button.style.position = 'absolute'
  button.style.top = '-3px'
  button.style.right = '190px'
  button.style.zIndex = '9'

  mountPoint.prepend(button)

  cleanupTasks.push(() => {
    button.remove()
    mountPoint.style.position = originPosition
  })

  return true
}

function tryMountEntry() {
  return mountPlayerWrapEntry() || mountLiveRoomEntry()
}

onMounted(() => {
  if (tryMountEntry())
    return

  const timer = window.setInterval(() => {
    if (tryMountEntry())
      window.clearInterval(timer)
  }, 1000)

  cleanupTasks.push(() => window.clearInterval(timer))
})

onUnmounted(() => {
  while (cleanupTasks.length) {
    const cleanup = cleanupTasks.pop()
    cleanup?.()
  }
})
</script>
