import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'
import { pingBackground, startLogForwarder } from './utils/log-forwarder'
import { injectPageStyles } from './utils/page-styles'
import App from './views/App.vue'

// 把 background 的 console 桥到页面 console（page DevTools 能直接看）
// 这样不用切到 chrome://extensions 的 service worker DevTools
startLogForwarder()

// 注入页面级 CSS 覆盖（影响 page DOM，不受 Shadow DOM 隔离）
injectPageStyles()

// 全局调试入口：页面 console 里直接调 btools.ping() / btools.log() 验 background
;(window as unknown as { btools: unknown }).btools = {
  ping: pingBackground
}

;(() => {
  // mount component to context window
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow({ mode: __DEV__ ? 'open' : 'closed' })
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/btools-vitesse.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()
