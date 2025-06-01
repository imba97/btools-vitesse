import type { ReplyParams } from './data/bilibili.data'
import md5 from 'md5'
import { apiStorage } from '~/storages/api'
import { useRequest } from './request'

const request = useRequest('https://api.bilibili.com/x')

export default class BilibiliApi {
  static getNav() {
    return request.get('/web-interface/nav')
  }

  static getUserInfo(mid: number | string) {
    return request.get('/space/wbi/acc/info', withWbi({
      mid
    }))
  }

  static getReply(params: ReplyParams) {
    return request.get('/v2/reply/wbi/main', withWbi(params))
  }
}

const mixinKeyEncTab = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string) => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

// 为请求参数进行 wbi 签名
function withWbi(params: Record<string, any>) {
  const mixin_key = getMixinKey(apiStorage.wbi.value.img_key + apiStorage.wbi.value.sub_key)
  const curr_time = Math.round(Date.now() / 1000)
  const chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object
    .keys(params)
    .sort()
    .map((key) => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  // 计算 md5
  const wbi_sign = md5(query + mixin_key)

  return _assign(params, {
    w_rid: wbi_sign
  })
}
