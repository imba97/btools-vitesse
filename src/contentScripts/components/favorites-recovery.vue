<template>
  <div aria-hidden="true" />
</template>

<script setup lang="ts">
import type { VideoViewData } from '~/api/data/bilibili.data'
import { buildSearchUrl } from '~/enums/popup'
import { favoritesRecoveryStorage } from '~/storages/favorites-recovery'
import { useContentPageRuntime } from '../runtime/page-runtime'
import { getRecoveredVideo } from '../utils/favorites-cache'
import {
  extractBvid,
  isInvalidCard,
  isTargetPage,
  patchCard,
  queryAnchor,
  queryTitleWrapper
} from '../utils/favorites-recovery'

const PROCESS_DEBOUNCE_MS = 120
const MAX_REQUESTS_PER_TICK = 8

const fetchCache = new Map<string, Promise<VideoViewData | null>>()
let pendingTimer: number | undefined
let disposed = false
const pageRuntime = useContentPageRuntime()

function markAttempted(card: Element): void {
  card.classList.add('btools-recovered')
}

function markPatched(card: Element): void {
  card.classList.add('btools-recovered', 'btools-recovered-ok')
}

function isAttempted(card: Element): boolean {
  return card.classList.contains('btools-recovered')
}

function fetchVideoInfo(bvid: string): Promise<VideoViewData | null> {
  // 进程内去重：同一 BV 号并发请求只发一次
  const cached = fetchCache.get(bvid)
  if (cached)
    return cached

  const task = getRecoveredVideo(bvid)
  fetchCache.set(bvid, task)
  return task
}

// 尝试恢复但接口/缓存没有数据时，patch 一个明确的"未搜索到信息"占位标题
// —— 让用户一眼看出这个卡片是已知失效、且本扩展试过但没找到（区别于"已成功找回"的红字）
const NOT_FOUND_TITLE = '已失效视频未搜索到信息'
const NOT_FOUND_COLOR = '#6b7280' // tailwind text-gray-500

function patchCardNotFound(card: Element): void {
  if (!(card instanceof HTMLElement))
    return
  const a = queryAnchor(card)
  if (a) {
    if (a.textContent !== NOT_FOUND_TITLE)
      a.textContent = NOT_FOUND_TITLE
    // 视觉提示：加粗 + text-gray（用 !important 顶住 B 站原站 hover/active 颜色规则）
    a.style.setProperty('font-weight', 'bold', 'important')
    a.style.setProperty('color', NOT_FOUND_COLOR, 'important')
    const wrapper = queryTitleWrapper(a)
    if (wrapper && wrapper.getAttribute('title') !== NOT_FOUND_TITLE)
      wrapper.setAttribute('title', NOT_FOUND_TITLE)
  }
}

async function recoverOne(card: Element, bvidAtStart: string): Promise<void> {
  if (isAttempted(card))
    return

  // 进入 biliplus 请求生命周期 —— 显示 loading 遮罩
  if (card instanceof HTMLElement)
    showRecoverOverlay(card)

  try {
    const data = await fetchVideoInfo(bvidAtStart)
    if (disposed)
      return

    if (!data) {
      if (card.isConnected) {
        patchCardNotFound(card)
        markAttempted(card)
      }
      return
    }

    // await 之后必须重新校验：卡片可能被替换/移除
    if (!card.isConnected || isAttempted(card))
      return

    const aNow = queryAnchor(card)
    if (extractBvid(aNow?.getAttribute('href')) !== bvidAtStart)
      return

    patchCard(card, data)
    markPatched(card)
  }
  finally {
    // 无论结果如何（成功 / 失败 / 组件卸载 / 卡片被替换）都尝试移除 overlay
    hideRecoverOverlay(card)
  }
}

function findListRoot(): Element | null {
  const sels = [
    '.space-favlist .items',
    '.fav-list-main .items',
    '.fav-video-list .items',
    '.items'
  ]
  for (const sel of sels) {
    const el = document.querySelector(sel)
    if (el)
      return el
  }
  return null
}

function collectCandidates(): Element[] {
  const root = findListRoot()
  const sources: Element[] = []
  if (root) {
    sources.push(...Array.from(root.querySelectorAll<HTMLElement>('.bili-video-card')))
    if (sources.length === 0)
      sources.push(...Array.from(root.children))
  }
  if (sources.length === 0) {
    sources.push(...Array.from(document.querySelectorAll<HTMLElement>('.bili-video-card')))
  }
  return sources
}

function processAll(_reason: string): void {
  if (disposed)
    return

  if (!isTargetPage())
    return

  const candidates = collectCandidates()

  if (candidates.length === 0)
    return

  let budget = MAX_REQUESTS_PER_TICK
  candidates.forEach((card) => {
    if (isAttempted(card))
      return
    if (!isInvalidCard(card))
      return
    const a = queryAnchor(card)
    const bvid = extractBvid(a?.getAttribute('href'))
    if (!bvid) {
      markAttempted(card)
      return
    }
    if (budget <= 0)
      return
    budget--
    void recoverOne(card, bvid)
  })
}

function scheduleProcess(reason: string): void {
  if (disposed || pendingTimer !== undefined)
    return
  pendingTimer = window.setTimeout(() => {
    pendingTimer = undefined
    processAll(reason)
  }, PROCESS_DEBOUNCE_MS)
}

// 在 biliplus 请求生命周期内，在卡片封面上显示 loading 遮罩
// - 入口（recoverOne 开始时）调用 showRecoverOverlay → 加 overlay + spinner
// - 完成（success patchCard / fail patchCardNotFound）调用 hideRecoverOverlay → 移除 overlay
// - 缓存命中时 fetch 几乎瞬时，overlay 闪一帧就消失，用户不会注意到

function showRecoverOverlay(card: HTMLElement): void {
  if (disposed)
    return
  const cover = card.querySelector<HTMLElement>('.bili-video-card__cover')
  if (!cover)
    return
  // 强制 relative（兜底）
  cover.style.position = 'relative'
  // 已显示就不重复加（同一卡片被并发处理时）
  if (cover.querySelector('.btools-loading-overlay'))
    return

  const overlay = document.createElement('div')
  overlay.className = 'btools-loading-overlay'
  overlay.style.cssText = [
    'position: absolute',
    'top: 0',
    'left: 0',
    'right: 0',
    'bottom: 0',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'background-color: rgba(0, 0, 0, 0.45)',
    'z-index: 9999',
    'pointer-events: none',
    'border-radius: inherit'
  ].join('; ')

  const spinner = document.createElement('div')
  spinner.className = 'btools-loading-spinner'
  overlay.appendChild(spinner)
  cover.appendChild(overlay)
}

function hideRecoverOverlay(card: Element): void {
  const cover = card.querySelector('.bili-video-card__cover')
  if (!cover)
    return
  const overlay = cover.querySelector('.btools-loading-overlay')
  if (overlay)
    overlay.remove()
}

// 点击已恢复卡片 → 按配置跳到搜索引擎（捕获阶段，preventDefault 顶住 <a> 默认跳转）
// - 用事件委托挂在 document 上，扛 B 站 re-render 把卡片换掉
// - 中键 / Ctrl / Cmd 点击放行（用户预期是新标签打开原 BV 页）
// - 仅拦截标题 <a> / 封面 <a>；UP 主链接（.bili-video-card__subtitle > a）始终走 B 站默认行为
// - 选项 Off 或模板为空 → buildSearchUrl 返回 null，不拦截
function onDocClick(event: MouseEvent): void {
  if (event.ctrlKey || event.metaKey || event.button === 1)
    return
  const target = event.target as Element | null
  if (!target)
    return
  const a = target.closest<HTMLAnchorElement>('a')
  if (!a)
    return
  // UP 主链接（卡片副标题里的作者 a）—— 永远不拦截，让它走 B 站默认跳转到 UP 主主页
  if (a.closest('.bili-video-card__subtitle'))
    return
  // 找被打到 btools-recovered-ok 标记的卡片（与 data-btools-title 同处）——
  // 这里只剩标题 a / 封面 a 两条路径会走到
  const card = a.closest<HTMLElement>('.btools-recovered-ok')
  if (!card)
    return
  const title = (card.dataset.btoolsTitle ?? '').trim()
  const option = favoritesRecoveryStorage.clickSearchInvalid.value.value
  const customTemplate = favoritesRecoveryStorage.clickSearchInvalidTemplate.value.value
  const url = buildSearchUrl(option, title, customTemplate)
  // Off / 模板为空 → url=null → 不拦截：用户没启用搜索就走 B 站默认跳转原 BV 页
  if (!url)
    return
  event.preventDefault()
  event.stopPropagation()
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  const stopDomSubscription = pageRuntime.onDomChanged(() => scheduleProcess('mutation'))
  const stopUrlWatch = watch(pageRuntime.url, () => scheduleProcess('navigation'))

  document.addEventListener('click', onDocClick, true)
  onUnmounted(() => {
    stopDomSubscription()
    stopUrlWatch()
    document.removeEventListener('click', onDocClick, true)
  })

  scheduleProcess('initial')
})

onUnmounted(() => {
  disposed = true
  if (pendingTimer !== undefined) {
    window.clearTimeout(pendingTimer)
    pendingTimer = undefined
  }
  fetchCache.clear()
})
</script>
