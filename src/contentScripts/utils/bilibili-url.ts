// B 站 URL / 图片地址相关的纯函数
//
// 这些函数原本散落在 favorites-recovery.ts 里（收藏夹场景），
// 播放页工具栏也要用，所以抽到这里统一维护；favorites-recovery.ts 保留 re-export 兼容旧调用。

/** 播放页 host —— 只认 www.bilibili.com，避免 space / t / live 等子站误判 */
export const VIDEO_HOSTNAME = 'www.bilibili.com'

/** 匹配 /video/BVxxxxxxxxxx（BV 号固定 10 位字符） */
export const BV_PATH_RE = /\/video\/(BV[0-9A-Za-z]{10})(?:\/|$)/

/** 播放页 pathname：必须以 /video/BV号 开头 */
export const VIDEO_PATH_RE = /^\/video\/(BV[0-9A-Za-z]{10})(?:\/|$)/

export function toHttps(url: string): string {
  if (url.startsWith('//'))
    return `https:${url}`
  if (url.startsWith('http://'))
    return `https://${url.slice(7)}`
  return url
}

/** 解析失败时返回 null —— `extractBvid` / `isVideoPage` 都需要先拿到 URL 再做判断 */
function safeUrl(href: string): URL | null {
  try {
    return new URL(href, location.href)
  }
  catch {
    return null
  }
}

export function extractBvid(href: string | null | undefined): string | null {
  if (!href)
    return null
  const url = safeUrl(href)
  if (!url)
    return null
  const m = url.pathname.match(BV_PATH_RE)
  return m ? m[1] : null
}

/**
 * 是否是播放页（www.bilibili.com/video/BVxxxxxxxxxx）
 *
 * 注入功能前先用它做校验 —— 番剧 /bangumi、专栏 /read、收藏夹 space.bilibili.com 都不算。
 */
export function isVideoPage(href: string = location.href): boolean {
  const url = safeUrl(href)
  if (!url)
    return false
  return url.hostname === VIDEO_HOSTNAME && VIDEO_PATH_RE.test(url.pathname)
}

/**
 * 封面地址归一化
 *
 * B 站的图片地址常带缩放后缀（`xxx.jpg@672w_378h_1c.webp`），
 * 截掉 `@` 之后的部分拿到原图；顺手把协议相对 / http 转成 https。
 */
export function normalizeCoverUrl(pic: string | null | undefined): string | null {
  if (!pic)
    return null
  const trimmed = pic.trim()
  if (!trimmed)
    return null
  return toHttps(trimmed.split('@')[0])
}
