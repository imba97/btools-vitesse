import type {
  PageWorldError,
  PageWorldEvent,
  PageWorldPayloadMap,
  PageWorldRequestEnvelope,
  PageWorldRequestMessage,
  PageWorldResponseEnvelope
} from '~/bridge/page-world'
import { PAGE_WORLD_BUS_REQUEST } from '~/bridge/page-world'

const DEFAULT_TIMEOUT_MS = 1500

export interface BusRequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

export class BusClientError extends Error {
  code: PageWorldError['code']

  constructor(error: PageWorldError) {
    super(error.message)
    this.name = 'BusClientError'
    this.code = error.code
  }
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function toBusError(error: unknown): PageWorldError {
  if (error instanceof BusClientError) {
    return {
      code: error.code,
      message: error.message
    }
  }

  if ((error as any)?.name === 'AbortError') {
    return {
      code: 'ABORTED',
      message: 'Request aborted'
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: String((error as any)?.message || error || 'Unknown bus error')
  }
}

function waitAbort(signal: AbortSignal): Promise<never> {
  if (signal.aborted)
    return Promise.reject(new DOMException('Request aborted', 'AbortError'))

  return new Promise((_, reject) => {
    const handler = () => {
      signal.removeEventListener('abort', handler)
      reject(new DOMException('Request aborted', 'AbortError'))
    }
    signal.addEventListener('abort', handler, { once: true })
  })
}

function waitTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new BusClientError({
        code: 'TIMEOUT',
        message: `Page-world request timeout after ${timeoutMs}ms`
      }))
    }, timeoutMs)
  })
}

export async function requestBus<E extends PageWorldEvent>(
  event: E,
  payload: PageWorldPayloadMap[E],
  options: BusRequestOptions = {}
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const requestId = createRequestId()

  const envelope: PageWorldRequestEnvelope<E> = {
    requestId,
    event,
    payload,
    timeoutMs
  }

  const message: PageWorldRequestMessage<E> = {
    type: PAGE_WORLD_BUS_REQUEST,
    envelope
  }

  const requestTask = browser.runtime.sendMessage(message) as Promise<PageWorldResponseEnvelope<E>>
  const races: Array<Promise<any>> = [requestTask, waitTimeout(timeoutMs)]

  if (options.signal)
    races.push(waitAbort(options.signal))

  try {
    const response = await Promise.race(races) as PageWorldResponseEnvelope<E>
    if (!response || response.requestId !== requestId) {
      throw new BusClientError({
        code: 'INTERNAL_ERROR',
        message: 'Invalid bus response'
      })
    }

    if (!response.ok)
      throw new BusClientError(response.error)

    return response.data
  }
  catch (error) {
    throw new BusClientError(toBusError(error))
  }
}
