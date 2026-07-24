// content-script 侧：失效视频恢复数据源（含缓存 + 限流）
//
// 优先级：
//   1) 缓存命中 → 直接返回（data / notFound 都算命中）
//   2) biliplus → 成功：缓存 { data }（30 天 TTL）；失败：缓存 { notFound: true }（10 天 TTL）
//   3) 缓存 miss 且 biliplus 失败 → 返回 null
//
// 限流：2 并发 + 每槽位 1s cooldown（稳态 2 req/s），避免被 biliplus 屏蔽
//
// 缓存存在 storage.local 里，结构见 src/storages/favorites-recovery.ts

import type { VideoViewData } from '~/api/data/bilibili.data'
import type { CachedVideo } from '~/storages/favorites-recovery'
import {
  CACHE_TTL_MS,

  favoritesRecoveryStorage,
  NOT_FOUND_CACHE_TTL_MS
} from '~/storages/favorites-recovery'
import { RateLimiter } from '~/utils/rate-limiter'
import { getVideoInfoBiliplus } from './bilibili-extra'

// 单实例 limiter：同一扩展内全局共享
const limiter = new RateLimiter({ maxConcurrent: 2, intervalMs: 1000 })

function ttlForEntry(entry: CachedVideo): number {
  return entry.notFound ? NOT_FOUND_CACHE_TTL_MS : CACHE_TTL_MS
}

function isExpired(entry: CachedVideo, now: number): boolean {
  return now - entry.cachedAt >= ttlForEntry(entry)
}

async function readCache(): Promise<Record<string, CachedVideo>> {
  return favoritesRecoveryStorage.cache.value ?? {}
}

async function writeCache(next: Record<string, CachedVideo>): Promise<void> {
  favoritesRecoveryStorage.cache.value = next
}

// 读缓存条目：命中且未过期 → 返回；缺失 / 已过期 → 返回 null（顺手清掉过期条目）
async function getCacheEntry(bvid: string): Promise<CachedVideo | null> {
  const cache = await readCache()
  const entry = cache[bvid]
  if (!entry)
    return null
  if (isExpired(entry, Date.now())) {
    delete cache[bvid]
    void writeCache(cache)
    return null
  }
  return entry
}

async function setCacheEntry(
  bvid: string,
  fields: Omit<CachedVideo, 'bvid' | 'cachedAt'>
): Promise<void> {
  const cache = await readCache()
  cache[bvid] = { bvid, cachedAt: Date.now(), ...fields }
  await writeCache(cache)
}

async function fetchAndCache(bvid: string): Promise<VideoViewData | null> {
  const bp = await limiter.enqueue(() => getVideoInfoBiliplus({ bvid }))

  if (bp.code === 0 && bp.data) {
    const data: VideoViewData = {
      bvid,
      aid: bp.data.aid,
      title: bp.data.title,
      pic: bp.data.pic,
      duration: 0,
      desc: bp.data.description,
      owner: { mid: bp.data.mid, name: bp.data.author, face: '' }
    }
    await setCacheEntry(bvid, { data })
    return data
  }

  // 失败也缓存为 notFound —— 避免每次扫到同一个失效视频都打一次 biliplus（被屏蔽风险 + 浪费请求）
  // 短 TTL 让失效视频后续重新上架后有机会被重新发现
  await setCacheEntry(bvid, { notFound: true })
  return null
}

/**
 * 取失效视频数据：
 * - 缓存命中（data / notFound 都算命中）→ 直接返回（null for notFound）
 * - 缓存 miss → 走 biliplus 限流链 → 成功写回 / 失败也写 notFound
 */
export async function getRecoveredVideo(bvid: string): Promise<VideoViewData | null> {
  const entry = await getCacheEntry(bvid)
  if (entry) {
    // 之前已成功 → 直接返回
    if (entry.data)
      return entry.data
    // 之前已失败 → 跳过 biliplus，TTL 到期后下次 miss 会自动重试
    return null
  }
  return fetchAndCache(bvid)
}
