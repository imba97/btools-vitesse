// content-script 专用的 cross-origin fetch：bilibili 之外的目标没有 CORS header，
// 浏览器会拦截，所以委托给 background service worker（host_permissions 授权可绕过 CORS）。
// background handler 在 src/background/scripts/extra-fetch.ts

const MESSAGE_TYPE = 'btools:extra-fetch'
const SEND_TIMEOUT_MS = 8000

interface FetchResponse {
  ok: boolean
  status: number
  body: string
  error?: string
}

export async function extraFetch(url: string): Promise<string> {
  // sendMessage 在 background 没装好 / worker 没 wakeup 时会一直挂 —— 加超时兜底
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`sendMessage timeout (${SEND_TIMEOUT_MS}ms) — background worker 没响应`)), SEND_TIMEOUT_MS)
  })

  let res: FetchResponse | undefined
  try {
    res = await Promise.race([
      browser.runtime.sendMessage({ type: MESSAGE_TYPE, url }) as Promise<FetchResponse>,
      timeout
    ])
  }
  catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
  finally {
    if (timer !== undefined)
      clearTimeout(timer)
  }

  if (!res) {
    throw new Error('empty response from background')
  }
  if (!res.ok) {
    throw new Error(res.error || `background fetch failed: status ${res.status}`)
  }
  return res.body
}
