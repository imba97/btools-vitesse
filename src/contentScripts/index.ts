import { BackgroundMessageType, sendBackgroundRequest } from '~/protocol/background'
import { createContentFeatures } from './runtime/feature-registry'
import { PageRuntime } from './runtime/page-runtime'
import { injectPageStyles } from './utils/page-styles'

injectPageStyles()

if (__DEV__) {
  ;(window as unknown as { btools: { ping: () => Promise<{ at: number }> } }).btools = {
    ping: () => sendBackgroundRequest({ type: BackgroundMessageType.ping })
  }
}

;(() => {
  const container = document.createElement('div')
  container.id = __NAME__
  container.style.display = 'none'
  document.body.insertBefore(container, document.body.firstChild)
  const runtime = new PageRuntime(createContentFeatures(container))
  runtime.start()
  window.addEventListener('pagehide', () => runtime.dispose(), { once: true })
})()
