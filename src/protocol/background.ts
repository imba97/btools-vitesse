export const BackgroundMessageType = {
  fetchText: 'btools/fetch-text',
  ping: 'btools/ping'
} as const

export type BackgroundRequest
  = | { type: typeof BackgroundMessageType.fetchText, url: string }
    | { type: typeof BackgroundMessageType.ping }

export type BackgroundResponse<T>
  = | { ok: true, value: T }
    | { ok: false, error: string }

export interface PingResult {
  at: number
}

const ALLOWED_FETCH_ORIGINS = new Set([
  'https://www.biliplus.com'
])

export function isBackgroundRequest(value: unknown): value is BackgroundRequest {
  if (!value || typeof value !== 'object')
    return false

  const request = value as Partial<BackgroundRequest>
  if (request.type === BackgroundMessageType.ping)
    return true

  return request.type === BackgroundMessageType.fetchText
    && typeof request.url === 'string'
}

export function isAllowedFetchUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ALLOWED_FETCH_ORIGINS.has(url.origin)
  }
  catch {
    return false
  }
}

export async function sendBackgroundRequest<T>(
  request: BackgroundRequest,
  timeoutMs = 8000
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Background request timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    const response = await Promise.race([
      browser.runtime.sendMessage(request) as Promise<BackgroundResponse<T>>,
      timeout
    ])
    if (!response.ok)
      throw new Error(response.error)
    return response.value
  }
  finally {
    if (timeoutId !== undefined)
      clearTimeout(timeoutId)
  }
}
