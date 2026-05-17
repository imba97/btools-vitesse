import type {
  PageWorldRequestEnvelope,
  PageWorldRequestMessage,
  PageWorldResponseEnvelope
} from '~/bridge/page-world'
import { PAGE_WORLD_BUS_REQUEST } from '~/bridge/page-world'
import { dispatchPageWorldEvent } from './page-world-executors'

let initialized = false

function asError(error: unknown): { code: any, message: string } {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return {
      code: (error as any).code,
      message: String((error as any).message)
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: String((error as any)?.message || error || 'Unknown page world error')
  }
}

function isRequestMessage(message: unknown): message is PageWorldRequestMessage {
  return (
    !!message
    && typeof message === 'object'
    && (message as any).type === PAGE_WORLD_BUS_REQUEST
    && !!(message as any).envelope
  )
}

async function handleRequest(
  envelope: PageWorldRequestEnvelope,
  sender: any
): Promise<PageWorldResponseEnvelope> {
  const start = Date.now()
  const requestId = envelope.requestId

  if (!sender.tab?.id) {
    return {
      requestId,
      ok: false,
      error: {
        code: 'CONTEXT_UNAVAILABLE',
        message: 'Missing sender tab id'
      },
      elapsedMs: Date.now() - start
    }
  }

  try {
    const data = await dispatchPageWorldEvent(sender.tab.id, envelope.event, envelope.payload as any)
    return {
      requestId,
      ok: true,
      data: data as any,
      elapsedMs: Date.now() - start
    }
  }
  catch (error) {
    const parsed = asError(error)
    return {
      requestId,
      ok: false,
      error: {
        code: parsed.code,
        message: parsed.message
      },
      elapsedMs: Date.now() - start
    }
  }
}

export function registerPageWorldBus() {
  if (initialized)
    return
  initialized = true

  browser.runtime.onMessage.addListener((message: unknown, sender: any) => {
    if (!isRequestMessage(message))
      return undefined

    return handleRequest(message.envelope, sender)
  })
}
