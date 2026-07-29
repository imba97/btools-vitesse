import type { ContentFeature } from './page-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageRuntime } from './page-runtime'

describe('page runtime', () => {
  let runtime: PageRuntime | undefined

  afterEach(() => {
    runtime?.dispose()
    runtime = undefined
    history.replaceState({}, '', '/')
  })

  it('mounts matching features, unmounts them on navigation, and shares DOM notifications', async () => {
    const mountVideo = vi.fn(async () => vi.fn())
    const stopVideo = vi.fn()
    mountVideo.mockResolvedValue(stopVideo)
    const domListener = vi.fn()
    const features: ContentFeature[] = [
      {
        id: 'video',
        matches: url => url.pathname.startsWith('/video/'),
        mount: mountVideo
      }
    ]

    history.replaceState({}, '', '/video/BV1wT4y137DS')
    runtime = new PageRuntime(features)
    runtime.onDomChanged(domListener)
    runtime.start()
    await vi.waitFor(() => expect(mountVideo).toHaveBeenCalledTimes(1))

    history.pushState({}, '', '/space/1/favlist')
    await vi.waitFor(() => expect(stopVideo).toHaveBeenCalledTimes(1))
    expect(domListener).toHaveBeenCalled()
  })
})
