import type { BackgroundRequest, BackgroundResponse } from '~/protocol/background'
import { BackgroundMessageType, isAllowedFetchUrl, isBackgroundRequest } from '~/protocol/background'

export async function handleBackgroundRequest(
  request: BackgroundRequest
): Promise<BackgroundResponse<string | { at: number }>> {
  if (request.type === BackgroundMessageType.ping) {
    return { ok: true, value: { at: Date.now() } }
  }

  if (!isAllowedFetchUrl(request.url)) {
    return { ok: false, error: 'The requested URL is not permitted.' }
  }

  try {
    const response = await fetch(request.url, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
      redirect: 'follow'
    })
    if (!response.ok) {
      return { ok: false, error: `Request failed with status ${response.status}` }
    }
    return { ok: true, value: await response.text() }
  }
  catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function registerBackgroundRequestHandler(): void {
  browser.runtime.onMessage.addListener((message: unknown, sender: { id?: string }) => {
    if (!isBackgroundRequest(message))
      return undefined
    if (sender.id && sender.id !== browser.runtime.id) {
      return { ok: false, error: 'Only this extension may call this endpoint.' }
    }
    return handleBackgroundRequest(message)
  })
}
