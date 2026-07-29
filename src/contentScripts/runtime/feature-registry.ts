import type { Component } from 'vue'
import type { ContentFeature, ContentPageRuntime } from './page-runtime'
import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'
import { isVideoPage } from '../utils/bilibili-url'
import { isTargetPage } from '../utils/favorites-recovery'
import { ContentPageRuntimeKey } from './page-runtime'

function mountVueFeature(
  component: Component,
  featureId: string,
  runtimeRoot: HTMLElement,
  runtime: ContentPageRuntime
): () => void {
  const mountPoint = document.createElement('div')
  mountPoint.dataset.btoolsFeature = featureId
  runtimeRoot.appendChild(mountPoint)

  const app = createApp(component)
  setupApp(app)
  app.provide(ContentPageRuntimeKey, runtime)
  app.mount(mountPoint)

  return () => {
    app.unmount()
    mountPoint.remove()
  }
}

export function createContentFeatures(runtimeRoot: HTMLElement): ContentFeature[] {
  return [
    {
      id: 'video-toolbar',
      matches: url => isVideoPage(url.href),
      async mount(runtime) {
        const { default: VideoToolbar } = await import('../components/video-toolbar.vue')
        return mountVueFeature(VideoToolbar, 'video-toolbar', runtimeRoot, runtime)
      }
    },
    {
      id: 'favorites-recovery',
      matches: url => isTargetPage(url.href),
      async mount(runtime) {
        const { default: FavoritesRecovery } = await import('../components/favorites-recovery.vue')
        return mountVueFeature(FavoritesRecovery, 'favorites-recovery', runtimeRoot, runtime)
      }
    }
  ]
}
