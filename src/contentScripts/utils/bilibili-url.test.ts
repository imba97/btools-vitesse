import {
  extractBvid,
  isVideoPage,
  normalizeCoverUrl,
  toHttps
} from './bilibili-url'

describe('isVideoPage', () => {
  it('匹配标准播放页', () => {
    expect(isVideoPage('https://www.bilibili.com/video/BV1et411h7Ct')).toBe(true)
    expect(isVideoPage('https://www.bilibili.com/video/BV1et411h7Ct/')).toBe(true)
    expect(isVideoPage('https://www.bilibili.com/video/BV1et411h7Ct/?p=2&spm_id_from=333')).toBe(true)
  })

  it('格式不对的 BV 号不匹配', () => {
    expect(isVideoPage('https://www.bilibili.com/video/BV1et411h7C')).toBe(false)
    expect(isVideoPage('https://www.bilibili.com/video/av170001')).toBe(false)
    expect(isVideoPage('https://www.bilibili.com/video/')).toBe(false)
  })

  it('非播放页 / 非主站不匹配', () => {
    expect(isVideoPage('https://www.bilibili.com/')).toBe(false)
    expect(isVideoPage('https://www.bilibili.com/bangumi/play/ep123456')).toBe(false)
    expect(isVideoPage('https://space.bilibili.com/1/favlist')).toBe(false)
    expect(isVideoPage('https://live.bilibili.com/123')).toBe(false)
    expect(isVideoPage('https://m.bilibili.com/video/BV1et411h7Ct')).toBe(false)
  })

  it('非法 URL 返回 false', () => {
    expect(isVideoPage('not a url')).toBe(false)
  })
})

describe('extractBvid', () => {
  it('从播放页地址取出 BV 号', () => {
    expect(extractBvid('https://www.bilibili.com/video/BV1et411h7Ct/?p=3')).toBe('BV1et411h7Ct')
  })

  it('取不到时返回 null', () => {
    expect(extractBvid('https://www.bilibili.com/')).toBeNull()
    expect(extractBvid(null)).toBeNull()
  })
})

describe('normalizeCoverUrl', () => {
  it('去掉缩放后缀拿原图', () => {
    expect(normalizeCoverUrl('https://i0.hdslb.com/bfs/archive/abc.jpg@672w_378h_1c.webp'))
      .toBe('https://i0.hdslb.com/bfs/archive/abc.jpg')
  })

  it('协议相对地址补成 https', () => {
    expect(normalizeCoverUrl('//i0.hdslb.com/bfs/archive/abc.jpg'))
      .toBe('https://i0.hdslb.com/bfs/archive/abc.jpg')
    expect(normalizeCoverUrl('http://i0.hdslb.com/bfs/archive/abc.jpg'))
      .toBe('https://i0.hdslb.com/bfs/archive/abc.jpg')
  })

  it('空值返回 null', () => {
    expect(normalizeCoverUrl('')).toBeNull()
    expect(normalizeCoverUrl('   ')).toBeNull()
    expect(normalizeCoverUrl(undefined)).toBeNull()
  })
})

describe('toHttps', () => {
  it('保持已是 https 的地址不变', () => {
    expect(toHttps('https://i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
  })

  it('协议相对 / http 补成 https', () => {
    expect(toHttps('//i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
    expect(toHttps('http://i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
  })
})

describe('extractBvid 边界', () => {
  it('小写 bv 前缀不匹配（实现是大小写敏感的，BV 是固定大写）', () => {
    expect(extractBvid('https://www.bilibili.com/video/bv1et411h7Ct')).toBeNull()
  })

  it('相对路径相对当前页解析', () => {
    // 当前 location 是 www.bilibili.com —— 相对路径会拼到同源
    expect(extractBvid('/video/BV1et411h7Ct')).toBe('BV1et411h7Ct')
  })
})
