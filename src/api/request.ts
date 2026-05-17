const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}

interface RequestOptions {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
}

export class RequestError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
    readonly responseBody?: string
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

const defaultRequestOptions: Required<RequestOptions> = {
  timeoutMs: 8000,
  retries: 1,
  retryDelayMs: 300
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function isRetryableError(error: unknown) {
  if (error instanceof RequestError) {
    return (error.status ?? 0) >= 500
  }

  if (error instanceof DOMException) {
    return error.name === 'AbortError'
  }

  return error instanceof TypeError
}

async function requestJson<T>(url: URL | string, init: RequestInit, options: RequestOptions = {}) {
  const mergedOptions = {
    ...defaultRequestOptions,
    ...options
  }

  let attempt = 0

  while (attempt <= mergedOptions.retries) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new RequestError(
          `Request failed with status ${response.status}`,
          String(url),
          response.status,
          await response.text()
        )
      }

      return await response.json() as T
    }
    catch (error) {
      const shouldRetry = attempt < mergedOptions.retries && isRetryableError(error)
      if (!shouldRetry) {
        if (error instanceof RequestError) {
          throw error
        }
        throw new RequestError('Request failed', String(url), undefined, error instanceof Error ? error.message : undefined)
      }

      await wait(mergedOptions.retryDelayMs * (attempt + 1))
      attempt += 1
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  throw new RequestError('Request exceeded retry limit', String(url))
}

export function useRequest(baseUrl: string) {
  const get = async <T>(path: string, data?: any, options?: RequestOptions) => {
    const url = new URL(`${baseUrl}${path}`)

    if (data) {
      _forEach(data, (value, key) => {
        url.searchParams.append(key, value)
      })
    }

    return requestJson<T>(url, {
      method: 'GET',
      headers: defaultHeaders
    }, options)
  }

  const post = async <T>(path: string, data?: any, options?: RequestOptions) => {
    const formData = new FormData()

    if (data) {
      _forEach(data, (value, key) => {
        formData.append(key, value)
      })
    }

    return requestJson<T>(`${baseUrl}/${path}`, {
      method: 'POST',
      body: formData,
      headers: defaultHeaders
    }, options)
  }

  return {
    get,
    post
  }
}
