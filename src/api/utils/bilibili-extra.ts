import type {
  BiliplusViewData
} from '../data/bilibili.data'

// biliplus 原始响应：成功时直接是数据对象本身，失败时是 {code,message,ttl}
export interface BiliplusRaw {
  ver?: number
  id?: number
  title?: string
  description?: string
  pic?: string
  author?: string
  mid?: number
  created?: number
  created_at?: string
  code?: number
  message?: string
  ttl?: number
}

export function biliplusToData(raw: BiliplusRaw): BiliplusViewData | null {
  if (raw.code !== undefined)
    return null
  if (!raw.title || !raw.pic)
    return null
  return {
    aid: raw.id ?? 0,
    title: raw.title,
    description: raw.description ?? '',
    pic: raw.pic,
    author: raw.author ?? '',
    mid: raw.mid ?? 0,
    created: raw.created ?? 0,
    created_at: raw.created_at ?? ''
  }
}

export function biliplusToError(raw: BiliplusRaw): { code: number, message?: string } {
  return { code: raw.code ?? -1, message: raw.message }
}
