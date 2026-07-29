// 收藏夹失效视频缓存的过期清理
//
// 每次扩展启动跑一遍：遍历 storage.local 里 favorites-recovery.cache，
// 删掉 cachedAt 距今 ≥ 30 天的条目，写回。
//
// 使用与内容端相同的缓存仓储与 TTL 规则，避免两个运行时对过期语义产生漂移。

import {
  favoritesRecoveryStorage,
  pruneExpiredCachedVideos
} from '~/storages/favorites-recovery'

export async function runFavoritesRecoveryCacheCleanup(): Promise<void> {
  try {
    await favoritesRecoveryStorage.cache.ready
    await favoritesRecoveryStorage.cache.update(cache => pruneExpiredCachedVideos(cache))
  }
  catch {
    // 静默清理失败
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
