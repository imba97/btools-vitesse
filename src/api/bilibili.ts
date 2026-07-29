import type { ReplyParams, VideoViewParams, VideoViewResponse } from './data/bilibili.data'
import { useRequest } from './request'
import { signWbiParams } from './wbi'
import { ensureWbiKeys } from './wbi-service'

const request = useRequest('https://api.bilibili.com/x')

export default class BilibiliApi {
  static getNav() {
    return request.get('/web-interface/nav')
  }

  static async getUserInfo(mid: number | string) {
    return request.get('/space/wbi/acc/info', signWbiParams({
      mid
    }, await ensureWbiKeys()))
  }

  static async getReply(params: ReplyParams) {
    return request.get('/v2/reply/wbi/main', signWbiParams(params, await ensureWbiKeys()))
  }

  static getVideoInfo(params: VideoViewParams) {
    return request.get<VideoViewResponse>('/web-interface/view', params)
  }

  // 注：biliplus 等非 api.bilibili.com 的镜像源不在这里，因为
  // content script 受 CORS 约束，需要走 background 中转（见 src/contentScripts/utils/bilibili-extra.ts）
}
