import { isFirefox, isForbiddenUrl } from '~/env'

// Firefox fetch files from cache instead of reloading changes from disk,
// hmr will not work as Chromium based browser
browser.webNavigation.onCommitted.addListener(({ tabId, frameId, url }) => {
  // Filter out non main window events.
  if (frameId !== 0)
    return

  if (isForbiddenUrl(url))
    return

  const injectForFirefox = () => browser.tabs.executeScript(tabId, {
    file: '/dist/contentScripts/index.global.js',
    runAt: 'document_end'
  })

  const injectForChromium = () => browser.scripting.executeScript({
    target: { tabId },
    files: ['dist/contentScripts/index.global.js']
  })

  // inject the latest scripts
  const task = isFirefox
    ? injectForFirefox()
    : injectForChromium()

  task.catch(() => {})
})
