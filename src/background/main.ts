import { getCurrentAccount } from './scripts/accounts'
import { refreshWbiIfNeeded } from './scripts/prepare'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

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
