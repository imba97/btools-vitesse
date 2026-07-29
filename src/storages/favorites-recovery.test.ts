import { CACHE_TTL_MS, NOT_FOUND_CACHE_TTL_MS, pruneExpiredCachedVideos } from './favorites-recovery'

vi.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined)
    },
    onChanged: {
      addListener: vi.fn()
    }
  }
}))

describe('favorites recovery cache', () => {
  it('uses the shorter TTL for negative cache entries', () => {
    const now = Date.now()
    const cache = {
      success: { bvid: 'success', cachedAt: now - CACHE_TTL_MS + 1 },
      staleSuccess: { bvid: 'staleSuccess', cachedAt: now - CACHE_TTL_MS },
      notFound: { bvid: 'notFound', notFound: true, cachedAt: now - NOT_FOUND_CACHE_TTL_MS + 1 },
      staleNotFound: { bvid: 'staleNotFound', notFound: true, cachedAt: now - NOT_FOUND_CACHE_TTL_MS }
    }

    expect(pruneExpiredCachedVideos(cache, now)).toEqual({
      success: cache.success,
      notFound: cache.notFound
    })
  })
})
