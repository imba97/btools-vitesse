import type { VideoViewData } from '~/api/data/bilibili.data'

export const TARGET_HOSTNAME = 'space.bilibili.com'
export const FAVLIST_PATH_RE = /^\/[^/]+\/favlist(?:\/|$)/
export const BV_PATH_RE = /\/video\/(BV[0-9A-Za-z]{10})(?:\/|$)/

// B 站对失效视频封面 img 的 alt 占位文案，精确匹配避免误伤
export const INVALID_PLACEHOLDERS = new Set(['已失效视频', '已删除视频', '视频已失效'])

// 标题 anchor 选择器
export const TITLE_ANCHOR_SELECTORS = [
  '.bili-video-card__title--pr > a',
  '.bili-video-card__title > a',
  '.title > a'
]

export function toHttps(url: string): string {
  if (url.startsWith('//'))
    return `https:${url}`
  if (url.startsWith('http://'))
    return `https://${url.slice(7)}`
  return url
}

export function extractBvid(href: string | null | undefined): string | null {
  if (!href)
    return null
  let url: URL
  try {
    url = new URL(href, location.href)
  }
  catch {
    return null
  }
  const m = url.pathname.match(BV_PATH_RE)
  return m ? m[1] : null
}

export function isTargetPage(): boolean {
  return location.hostname === TARGET_HOSTNAME && FAVLIST_PATH_RE.test(location.pathname)
}

export function queryAnchor(card: Element): HTMLAnchorElement | null {
  for (const sel of TITLE_ANCHOR_SELECTORS) {
    const a = card.querySelector<HTMLAnchorElement>(sel)
    if (a)
      return a
  }
  return null
}

export function queryTitleWrapper(anchor: HTMLAnchorElement): HTMLElement | null {
  const candidates: Array<HTMLElement | null> = [
    anchor.parentElement,
    anchor.closest<HTMLElement>('.bili-video-card__title, .title')
  ]
  for (const c of candidates) {
    if (c)
      return c
  }
  return null
}

// 标题区域内的失效关键词（仅在 title wrapper 内匹配，避免误伤正常标题里恰好含"失效"的视频）
const INVALID_TITLE_HINTS = ['已失效', '已删除', '不见了', '不存在', '视频已']

// 卡片自身或祖先上可能的"失效"标记类（覆盖多版本 B 站）
const INVALID_CARD_CLASSES = [
  'disabled',
  'is-invalid',
  'invalid',
  'bili-video-card--invalid'
]

function queryTitleWrapperAny(anchor: HTMLAnchorElement | null): HTMLElement | null {
  if (!anchor)
    return null
  return anchor.closest<HTMLElement>('.bili-video-card__title, .title, .bili-video-card__title--pr')
}

// 主信号：扫描卡片内所有 <img> 的 alt，匹配 B 站失效占位文案
// B 站结构：.bili-video-card__cover > a > .bili-cover-card__thumbnail > img.b-img__inner
function isInvalidByCoverImgAlt(card: Element): boolean {
  const imgs = card.querySelectorAll<HTMLImageElement>('img')
  for (const img of imgs) {
    const alt = (img.alt || '').trim()
    if (alt && INVALID_PLACEHOLDERS.has(alt))
      return true
  }
  return false
}

export function isInvalidCard(card: Element): boolean {
  // 1) 主信号：封面 img 的 alt 是 B 站失效占位（最可靠）
  if (isInvalidByCoverImgAlt(card))
    return true

  // 2) 兜底：卡片或祖先命中失效标记类
  for (const cls of INVALID_CARD_CLASSES) {
    if (card.closest(`.${cls}`))
      return true
  }

  // 3) 兜底：标题区域文本含失效关键词 / 标题区域为空
  const a = queryAnchor(card)
  const titleEl = a
    ? queryTitleWrapperAny(a)
    : card.querySelector<HTMLElement>('.bili-video-card__title, .bili-video-card__title--pr, .title')
  if (titleEl) {
    const titleText = (titleEl.textContent || '').trim()
    if (!titleText)
      return true
    if (INVALID_TITLE_HINTS.some(h => titleText.includes(h)))
      return true
  }

  // 4) 兜底：标题 anchor 的 textContent 为空且能解析出 BV（被占位渲染成空文本）
  if (a && (!a.textContent || !a.textContent.trim()) && extractBvid(a.getAttribute('href')))
    return true

  // 5) 兜底：完全无 anchor（失效卡片有时直接干掉链接）
  if (!a)
    return true

  return false
}

export function patchCard(card: Element, info: VideoViewData): void {
  // 关键：把"真标题"这个数据写到卡片本身（与 btools-recovered-ok 类同处），而不是
  // title <a> 上。原因：卡片内通常有 2 个 <a>（标题 a + 封面 a），点封面时 a.textContent
  // 是空的（封面 a 里只有 <img>），把真标题放到卡片上可以保证任意 <a> 点击都能读到。
  // HTML attribute 不会被 B 站虚拟 DOM diff 当 text content 覆盖，扛 re-render。
  if (!(card instanceof HTMLElement))
    return
  card.dataset.btoolsTitle = info.title

  const a = queryAnchor(card)
  if (a) {
    // 注意：此处无条件覆盖 a.textContent —— patch 入口（recoverOne / favorites-recovery.vue）
    // 已经保证只在 isInvalidCard() 为 true 时调用，所以 a 当前文本就是占位文案（"已失效视频"
    // 等）或空，无条件覆盖是安全的。
    if (a.textContent !== info.title)
      a.textContent = info.title

    // 视觉提示"已被找回"：加粗 + text-red（用 !important 顶住 B 站原站 hover/active 颜色规则）
    a.style.setProperty('font-weight', 'bold', 'important')
    a.style.setProperty('color', '#ef4444', 'important')
  }
  // 标题 wrapper 上可能挂了 title 属性（用于 tooltip）
  if (a) {
    const wrapper = queryTitleWrapper(a)
    if (wrapper && wrapper.getAttribute('title') !== info.title)
      wrapper.setAttribute('title', info.title)
  }
  const httpsPic = toHttps(info.pic)
  const cover = card.querySelector('.bili-video-card__cover')
  if (cover instanceof HTMLImageElement) {
    if (cover.getAttribute('src') !== httpsPic)
      cover.src = httpsPic
    if (cover.alt !== info.title)
      cover.alt = info.title
  }
  else if (cover) {
    // B 站新版：cover 是包裹 div，封面 img 嵌在里面
    // 必须更新嵌套 img 的 alt（不然下次 scan 又会被判定为失效）和 src
    const nestedImg = cover.querySelector<HTMLImageElement>('img')
    if (nestedImg) {
      if (nestedImg.getAttribute('src') !== httpsPic)
        nestedImg.src = httpsPic
      if (nestedImg.alt !== info.title)
        nestedImg.alt = info.title
    }
    const bg = `url(${httpsPic})`
    if ((cover as HTMLElement).style.backgroundImage !== bg)
      (cover as HTMLElement).style.backgroundImage = bg
  }
}
