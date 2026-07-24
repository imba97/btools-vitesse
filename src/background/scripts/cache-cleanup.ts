// 收藏夹失效视频缓存的过期清理
//
// 每次扩展启动跑一遍：遍历 storage.local 里 favorites-recovery.cache，
// 删掉 cachedAt 距今 ≥ 30 天的条目，写回。
//
// 实现：直接用 webextension-polyfill 的 storage.local（不走 useWebExtensionStorage，
// 后台没有 Vue 上下文，且这是 fire-and-forget 操作，不需要响应式）

import type { CachedVideo } from '~/storages/favorites-recovery'
import { storage as extStorage } from 'webextension-polyfill'
import {
  CACHE_TTL_MS

} from '~/storages/favorites-recovery'

const STORAGE_KEY = 'favorites-recovery.cache'

export async function runFavoritesRecoveryCacheCleanup(): Promise<void> {
  try {
    const stored = await extStorage.local.get(STORAGE_KEY) as Record<string, CachedVideo> | undefined
    const cache = stored?.[STORAGE_KEY]
    if (!cache || typeof cache !== 'object')
      return

    const now = Date.now()
    const next: Record<string, CachedVideo> = {}
    let removed = 0
    for (const [bvid, entry] of Object.entries(cache)) {
      if (!entry || typeof entry.cachedAt !== 'number') {
        removed++
        continue
      }
      if (now - entry.cachedAt >= CACHE_TTL_MS) {
        removed++
        continue
      }
      next[bvid] = entry
    }

    if (removed > 0) {
      await extStorage.local.set({ [STORAGE_KEY]: next })
      console.log(`[btools:cache-cleanup] removed ${removed} expired entries, kept ${Object.keys(next).length}`)
    }
    else {
      console.log('[btools:cache-cleanup] no expired entries')
    }
  }
  catch (err) {
    console.warn('[btools:cache-cleanup] failed', err)
  }
}

export function registerFavoritesRecoveryCacheCleanup(): void {
  // 启动时跑一次
  browser.runtime.onStartup.addListener(() => {
    void runFavoritesRecoveryCacheCleanup()
  })
  // 首次安装/更新也跑一次（onStartup 不一定每次都触发，比如开发者模式下手动 reload）
  browser.runtime.onInstalled.addListener(() => {
    void runFavoritesRecoveryCacheCleanup()
  })
}
