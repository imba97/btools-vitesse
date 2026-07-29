import type { InjectionKey, ShallowRef } from 'vue'
import { inject, shallowRef } from 'vue'

export interface ContentFeature {
  id: string
  matches: (url: URL) => boolean
  mount: (runtime: ContentPageRuntime) => Promise<() => void> | (() => void)
}

export interface ContentPageRuntime {
  readonly url: Readonly<ShallowRef<URL>>
  onDomChanged: (listener: () => void) => () => void
}

export const ContentPageRuntimeKey: InjectionKey<ContentPageRuntime> = Symbol('ContentPageRuntime')

export function useContentPageRuntime(): ContentPageRuntime {
  const runtime = inject(ContentPageRuntimeKey)
  if (!runtime)
    throw new Error('Content features must be mounted by PageRuntime.')
  return runtime
}

export class PageRuntime implements ContentPageRuntime {
  readonly url = shallowRef(new URL(location.href))

  private readonly activeFeatures = new Map<string, () => void>()
  private readonly pendingFeatures = new Set<string>()
  private readonly domListeners = new Set<() => void>()
  private observer: MutationObserver | undefined
  private refreshScheduled = false
  private disposed = false
  private restoreHistory: (() => void) | undefined

  constructor(private readonly features: ContentFeature[]) {}

  start(): void {
    this.observer = new MutationObserver(() => this.scheduleRefresh())
    this.observer.observe(document.documentElement, { childList: true, subtree: true })
    window.addEventListener('popstate', this.scheduleRefresh)
    this.restoreHistory = this.observeHistory()
    this.scheduleRefresh()
  }

  onDomChanged(listener: () => void): () => void {
    this.domListeners.add(listener)
    return () => this.domListeners.delete(listener)
  }

  dispose(): void {
    if (this.disposed)
      return
    this.disposed = true
    this.observer?.disconnect()
    window.removeEventListener('popstate', this.scheduleRefresh)
    this.restoreHistory?.()
    this.domListeners.clear()
    for (const stop of this.activeFeatures.values())
      stop()
    this.activeFeatures.clear()
  }

  private scheduleRefresh = (): void => {
    if (this.disposed || this.refreshScheduled)
      return
    this.refreshScheduled = true
    queueMicrotask(() => {
      this.refreshScheduled = false
      if (this.disposed)
        return
      for (const listener of this.domListeners)
        listener()
      void this.refreshFeatures()
    })
  }

  private async refreshFeatures(): Promise<void> {
    const nextUrl = new URL(location.href)
    if (nextUrl.href !== this.url.value.href)
      this.url.value = nextUrl

    for (const feature of this.features) {
      const active = this.activeFeatures.get(feature.id)
      const matches = feature.matches(nextUrl)
      if (!matches && active) {
        active()
        this.activeFeatures.delete(feature.id)
        continue
      }
      if (matches && !active && !this.pendingFeatures.has(feature.id)) {
        this.pendingFeatures.add(feature.id)
        try {
          const stop = await feature.mount(this)
          if (this.disposed || !feature.matches(new URL(location.href))) {
            stop()
          }
          else {
            this.activeFeatures.set(feature.id, stop)
          }
        }
        finally {
          this.pendingFeatures.delete(feature.id)
        }
      }
    }
  }

  private observeHistory(): () => void {
    const { pushState, replaceState } = history
    history.pushState = (...args) => {
      const result = pushState.apply(history, args)
      this.scheduleRefresh()
      return result
    }
    history.replaceState = (...args) => {
      const result = replaceState.apply(history, args)
      this.scheduleRefresh()
      return result
    }
    return () => {
      history.pushState = pushState
      history.replaceState = replaceState
    }
  }
}
