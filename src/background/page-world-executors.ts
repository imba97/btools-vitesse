import type {
  GetWindowData,
  GetWindowPayload,
  PageWorldDataMap,
  PageWorldError,
  PageWorldEvent
} from '~/bridge/page-world'

function toError(code: PageWorldError['code'], message: string): PageWorldError {
  return { code, message }
}

function isUnsupportedWorldError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '')
  return (
    message.includes('world')
    || message.includes('MAIN')
    || message.includes('ExecutionWorld')
    || message.includes('Unexpected property')
  )
}

async function executeGetWindow(
  tabId: number,
  payload: GetWindowPayload
): Promise<GetWindowData> {
  if (payload.frame && payload.frame !== 'top') {
    throw toError('BAD_PAYLOAD', `Unsupported frame value: ${payload.frame}`)
  }

  const scriptingApi = browser.scripting
  if (!scriptingApi?.executeScript)
    throw toError('UNSUPPORTED_WORLD', 'browser.scripting.executeScript is unavailable')

  try {
    const results = await scriptingApi.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (key: GetWindowPayload['key']) => {
        const hostWindow = window as any
        const normalizeUrl = (value: unknown): string => {
          if (!value)
            return ''

          const src = String(value).trim()
          if (!src)
            return ''

          const [original] = src.split('@')
          if (!original)
            return ''

          if (original.startsWith('//'))
            return `https:${original}`

          return original
        }

        if (key === 'video-cover') {
          const state = hostWindow.__INITIAL_STATE__ || hostWindow.wrappedJSObject?.__INITIAL_STATE__
          const videoDataPic = normalizeUrl(state?.videoData?.pic)
          if (videoDataPic)
            return { url: videoDataPic, source: 'videoData.pic' as const }

          const epCover = normalizeUrl(state?.epInfo?.cover)
          if (epCover)
            return { url: epCover, source: 'epInfo.cover' as const }

          const mediaCover = normalizeUrl(state?.mediaInfo?.cover)
          if (mediaCover)
            return { url: mediaCover, source: 'mediaInfo.cover' as const }

          return null
        }

        const liveState = hostWindow.__NEPTUNE_IS_MY_WAIFU__ || hostWindow.wrappedJSObject?.__NEPTUNE_IS_MY_WAIFU__
        const roomCover = normalizeUrl(liveState?.roomInfoRes?.data?.room_info?.cover)
        if (roomCover)
          return { url: roomCover, source: 'room_info.cover' as const }

        return null
      },
      args: [payload.key]
    } as any)

    const result = results?.[0]?.result as GetWindowData | null | undefined
    if (!result?.url) {
      throw toError('NO_DATA', `No window data found for key: ${payload.key}`)
    }
    return result
  }
  catch (error) {
    if ((error as any)?.code)
      throw error

    if (isUnsupportedWorldError(error))
      throw toError('UNSUPPORTED_WORLD', `Execution world MAIN is unavailable: ${(error as any)?.message || error}`)

    throw toError('EXECUTE_FAILED', `executeScript failed: ${(error as any)?.message || error}`)
  }
}

export async function dispatchPageWorldEvent<E extends PageWorldEvent>(
  tabId: number,
  event: E,
  payload: GetWindowPayload
): Promise<PageWorldDataMap[E]> {
  if (event === 'get-window')
    return await executeGetWindow(tabId, payload) as PageWorldDataMap[E]

  throw toError('BAD_PAYLOAD', `Unsupported event: ${event}`)
}
