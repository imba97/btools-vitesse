export const PAGE_WORLD_BUS_REQUEST = 'btools:page-world:request'

export type PageWorldEvent = 'get-window'
export type WindowDataKey = 'video-cover' | 'live-cover'

export interface GetWindowPayload {
  key: WindowDataKey
  frame?: 'top'
}

export interface GetWindowData {
  url: string
  source: 'videoData.pic' | 'epInfo.cover' | 'mediaInfo.cover' | 'room_info.cover'
}

export interface PageWorldPayloadMap {
  'get-window': GetWindowPayload
}

export interface PageWorldDataMap {
  'get-window': GetWindowData
}

export type PageWorldErrorCode
  = | 'UNSUPPORTED_WORLD'
    | 'NO_DATA'
    | 'EXECUTE_FAILED'
    | 'TIMEOUT'
    | 'BAD_PAYLOAD'
    | 'CONTEXT_UNAVAILABLE'
    | 'INTERNAL_ERROR'
    | 'ABORTED'

export interface PageWorldError {
  code: PageWorldErrorCode
  message: string
}

export interface PageWorldRequestEnvelope<E extends PageWorldEvent = PageWorldEvent> {
  requestId: string
  event: E
  payload: PageWorldPayloadMap[E]
  timeoutMs?: number
}

export interface PageWorldSuccessEnvelope<E extends PageWorldEvent = PageWorldEvent> {
  requestId: string
  ok: true
  data: PageWorldDataMap[E]
  elapsedMs: number
}

export interface PageWorldFailureEnvelope {
  requestId: string
  ok: false
  error: PageWorldError
  elapsedMs: number
}

export type PageWorldResponseEnvelope<E extends PageWorldEvent = PageWorldEvent>
  = | PageWorldSuccessEnvelope<E>
    | PageWorldFailureEnvelope

export interface PageWorldRequestMessage<E extends PageWorldEvent = PageWorldEvent> {
  type: typeof PAGE_WORLD_BUS_REQUEST
  envelope: PageWorldRequestEnvelope<E>
}
