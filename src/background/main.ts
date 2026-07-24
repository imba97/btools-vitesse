import { getCurrentAccount } from './scripts/accounts'
import { registerFavoritesRecoveryCacheCleanup } from './scripts/cache-cleanup'
import { registerExtraFetch } from './scripts/extra-fetch'
import { registerLogForwarder, registerPingHandler } from './scripts/log-forwarder'
import { refreshWbiIfNeeded } from './scripts/prepare'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// 哨兵：每次 bg worker 起来都会跑（包含 MV3 休眠后被唤醒）。
// 放在最前 + log forwarder 也最先注册，这样这条日志一定能从页面 console 看到，
// 用来确认 worker 在跑。
registerLogForwarder()

globalThis.onerror = () => false
globalThis.onunhandledrejection = () => {}

browser.runtime.onInstalled.addListener((): void => {
  getCurrentAccount()
  void refreshWbiIfNeeded(true)
})

browser.runtime.onStartup.addListener(() => {
  void refreshWbiIfNeeded()
})

const WBI_REFRESH_ALARM = 'btools.refreshWbi'
const WBI_REFRESH_INTERVAL_MINUTES = 180

if (browser.alarms?.onAlarm) {
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === WBI_REFRESH_ALARM) {
      void refreshWbiIfNeeded(true)
    }
  })

  void browser.alarms.clear(WBI_REFRESH_ALARM).finally(() => {
    browser.alarms.create(WBI_REFRESH_ALARM, {
      periodInMinutes: WBI_REFRESH_INTERVAL_MINUTES
    })
  })
}

void refreshWbiIfNeeded()
registerExtraFetch()
registerFavoritesRecoveryCacheCleanup()
registerPingHandler()
