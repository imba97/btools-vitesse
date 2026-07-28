// 播放页封面地址：从 API 拿（content script 在 isolated world 读不到页面的 window.videoData）
//
// 调用链：BV 号 → BilibiliApi.getVideoInfo（api.bilibili.com/x/web-interface/view）→ data.pic
// 同一 BV 号只请求一次，结果放内存 Map；封面不需要跨会话持久化，所以不落 storage。

import BilibiliApi from '~/api/bilibili'
import { normalizeCoverUrl } from './bilibili-url'

const cache = new Map<string, Promise<string | null>>()

async function fetchCover(bvid: string): Promise<string | null> {
  const res = await BilibiliApi.getVideoInfo({ bvid })
  if (res.code !== 0 || !res.data)
    return null
  return normalizeCoverUrl(res.data.pic)
}

/**
 * 取视频封面原图地址，失败返回 null
 *
 * 并发/重复调用会复用同一个 Promise；请求失败（网络错误）不写缓存，下次可重试。
 */
export function getVideoCover(bvid: string): Promise<string | null> {
  const cached = cache.get(bvid)
  if (cached)
    return cached

  const task = fetchCover(bvid).catch((err) => {
    // 网络异常 —— 丢掉缓存条目，让用户能重试
    cache.delete(bvid)
    throw err
  })

  cache.set(bvid, task)
  return task
}

/** 仅供测试 / 调试重置 */
export function clearVideoCoverCache(): void {
  cache.clear()
}
