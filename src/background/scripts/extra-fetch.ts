// 把 cross-origin fetch（bilibili 之外，没有 CORS header 的目标）从 content script 挪到 background
// background 受 host_permissions 授权，可以绕过 CORS 直接 fetch
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

interface FetchRequest {
  type: 'btools:extra-fetch'
  url: string
}

interface FetchResponse {
  ok: boolean
  status: number
  body: string
  error?: string
}

export function registerExtraFetch() {
  const api = (browser as any)?.runtime
  if (!api?.onMessage?.addListener)
    return

  console.log('[btools:extra-fetch] listener registered')

  api.onMessage.addListener((message: unknown, _sender: any, sendResponse: (resp: unknown) => void) => {
    // 任何消息都打日志（调试用 —— 如果这里都不出现，说明消息根本没到 bg）
    const m = message as { type?: string, url?: string } | null | undefined
    console.log('[btools:extra-fetch] msg recv type=', m?.type, 'url=', m?.url)

    if (!message || typeof message !== 'object' || (message as any).type !== 'btools:extra-fetch')
      return false

    const url = (message as FetchRequest).url
    console.log('[btools:extra-fetch] req →', url)

    void (async () => {
      const startedAt = Date.now()
      try {
        const r = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': UA, 'Accept': '*/*' },
          redirect: 'follow'
        })
        const body = await r.text()
        const elapsed = Date.now() - startedAt
        console.log('[btools:extra-fetch] resp', r.status, url, 'bodyLen=', body.length, `(${elapsed}ms)`)
        const resp: FetchResponse = { ok: r.ok, status: r.status, body }
        sendResponse(resp)
      }
      catch (err) {
        const elapsed = Date.now() - startedAt
        console.warn('[btools:extra-fetch] failed', url, `(${elapsed}ms)`, err)
        const resp: FetchResponse = {
          ok: false,
          status: 0,
          body: '',
          error: err instanceof Error ? err.message : String(err)
        }
        sendResponse(resp)
      }
    })()

    // 表示会异步 sendResponse，保持 message channel 开启
    return true
  })
}
