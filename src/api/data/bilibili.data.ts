export interface ReplyParams {
  oid: string | number
  type: number
  mode: number
  pagination_str: string
  plat: number
  web_location: number
}

export interface VideoViewParams {
  bvid: string
}

export interface VideoViewOwner {
  mid: number
  name: string
  face: string
}

export interface VideoViewData {
  bvid: string
  aid: number
  title: string
  pic: string
  duration: number
  pubdate?: number
  desc?: string
  owner?: VideoViewOwner
}

export interface VideoViewResponse {
  code: number
  message?: string
  ttl?: number
  data?: VideoViewData
}

// biliplus：成功时直接返回数据对象（ver/id/title/...），错误时返回 {code,message,ttl}
// 这里统一定义为标准格式，转换在 API 层做
export interface BiliplusViewData {
  aid: number
  title: string
  description: string
  pic: string
  author: string
  mid: number
  created: number
  created_at: string
}

export interface BiliplusViewResponse {
  code: number
  message?: string
  ttl?: number
  data?: BiliplusViewData
}
