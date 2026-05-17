import type { VideoInfoProvider } from './video-info-provider'
import type { BiliplusAidInfo, BiliplusAidInfoParams, BiliplusAidInfoResponse } from '~/api/data/biliplus-provider.data'
import type { ProviderVideoInfo } from '~/api/data/video-info-provider.data'
import { RequestError, useRequest } from '~/api/request'

const request = useRequest('https://www.biliplus.com')
const BILIPLUS_COOLDOWN_MS = 5 * 60 * 1000
let biliplusBlockedUntil = 0

function pickNumber(value: unknown) {
  if (typeof value === 'number')
    return value
  if (typeof value === 'string' && value.trim())
    return Number(value)
  return undefined
}

function pickString(value: unknown) {
  return typeof value === 'string' && value.trim()
    ? value
    : undefined
}

function extractAidInfo(payload: BiliplusAidInfoResponse | null | undefined, aid?: number): BiliplusAidInfo | null {
  if (!payload || typeof payload !== 'object')
    return null

  const root = payload as BiliplusAidInfoResponse
  const data = root.data ?? root.result ?? root
  if (!data || typeof data !== 'object')
    return null

  const normalizedData = data as Record<string, unknown>

  if (aid != null) {
    const target = normalizedData[String(aid)]
    if (target && typeof target === 'object')
      return target as BiliplusAidInfo
  }

  if (normalizedData.list && typeof normalizedData.list === 'object') {
    const listTarget = (normalizedData.list as Record<string, unknown>)[String(aid)]
    if (listTarget && typeof listTarget === 'object')
      return listTarget as BiliplusAidInfo
  }

  if ('title' in normalizedData || 'pic' in normalizedData)
    return normalizedData

  const firstObject = Object.values(normalizedData).find(item => item && typeof item === 'object')
  return firstObject ? firstObject as BiliplusAidInfo : null
}

export const biliplusProvider: VideoInfoProvider = {
  name: 'biliplus',
  priority: 10,
  canProvide(fields) {
    return fields.length > 0
  },
  async fetch(context) {
    if (!context.aid)
      return null

    if (Date.now() < biliplusBlockedUntil) {
      // eslint-disable-next-line no-console
      console.info('[invalid-video][provider] biliplus in cooldown, skip request', {
        blockedUntil: biliplusBlockedUntil
      })
      return null
    }

    const params: BiliplusAidInfoParams = { aid: String(context.aid) }
    let response: BiliplusAidInfoResponse
    try {
      response = await request.get<BiliplusAidInfoResponse>('/api/aidinfo', params)
    }
    catch (error) {
      if (error instanceof RequestError && (error.status ?? 0) >= 500) {
        biliplusBlockedUntil = Date.now() + BILIPLUS_COOLDOWN_MS

        console.warn('[invalid-video][provider] biliplus 5xx, enter cooldown', {
          status: error.status,
          cooldownMs: BILIPLUS_COOLDOWN_MS
        })
        return null
      }
      throw error
    }

    const aidInfo = extractAidInfo(response, context.aid)

    if (!aidInfo)
      return null

    const info: Partial<ProviderVideoInfo> = {
      aid: pickNumber(aidInfo.aid ?? context.aid),
      title: pickString(aidInfo.title),
      cover: pickString(aidInfo.pic ?? aidInfo.cover),
      ownerMid: pickNumber(aidInfo.mid ?? aidInfo.owner_mid),
      ownerName: pickString(aidInfo.author ?? aidInfo.owner_name),
      ownerFace: pickString(aidInfo.face),
      pubdate: pickNumber(aidInfo.created ?? aidInfo.pubdate),
      desc: pickString(aidInfo.description ?? aidInfo.desc),
      pageCount: pickNumber(aidInfo.videos ?? aidInfo.page_count)
    }

    return info
  }
}
