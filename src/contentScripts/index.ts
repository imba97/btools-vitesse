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
  // 同一份 CSS 也挂到 main <head>：bar 是 Teleport 到 B 站 main DOM 的（host 与 arc_toolbar_report 同父自然同宽），
  // 那里走不到 shadow root 的 <link>。注：bundle 里和 B 站用到的 utility class（如 .absolute）值完全相同，
  // 重复加载不会带来行为变化，只是多一份 cache。
  const mainStyleEl = document.createElement('link')
  mainStyleEl.setAttribute('rel', 'stylesheet')
  mainStyleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/btools-vitesse.css'))
  document.head.appendChild(mainStyleEl)
  // 插到 body 最前面（所有 B 站内容之前），保证视觉位置在页面顶部、压住 fixed header
  document.body.insertBefore(container, document.body.firstChild)
  // closed shadow 下，element.shadowRoot 在外部 Realm 访问会返回 null；
  // 把引用挂到 globalThis 让同 Realm 的其他模块（比如 video-toolbar.vue）能拿到
  ;(globalThis as Record<string, unknown>)[`__${__NAME__}_shadow`] = shadowDOM
  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()
