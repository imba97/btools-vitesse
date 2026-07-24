// content-script 侧失效视频恢复的数据源。
// 调用链路：content script → extraFetch (sendMessage) → background fetch (CORS-bypass) → 解析响应
//
// 复用 src/api/utils/bilibili-extra.ts 的纯函数做响应适配

import type {
  BiliplusViewResponse,
  VideoViewParams
} from '~/api/data/bilibili.data'
import type { BiliplusRaw } from '~/api/utils/bilibili-extra'
import {

  biliplusToData,
  biliplusToError
} from '~/api/utils/bilibili-extra'
import { extraFetch } from './extra-fetch'

export async function getVideoInfoBiliplus(params: VideoViewParams): Promise<BiliplusViewResponse> {
  const url = `https://www.biliplus.com/api/view?id=${encodeURIComponent(params.bvid)}`
  try {
    const body = await extraFetch(url)
    const raw = JSON.parse(body) as BiliplusRaw
    const data = biliplusToData(raw)
    if (data)
      return { code: 0, data }
    return biliplusToError(raw)
  }
  catch (err) {
    return { code: -1, message: err instanceof Error ? err.message : 'fetch failed' }
  }
}
