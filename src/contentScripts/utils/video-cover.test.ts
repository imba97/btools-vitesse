import BilibiliApi from '~/api/bilibili'
import { clearVideoCoverCache, getVideoCover } from './video-cover'

vi.mock('~/api/bilibili', () => ({
  default: {
    getVideoInfo: vi.fn()
  }
}))

const getVideoInfo = vi.mocked(BilibiliApi.getVideoInfo)

describe('getVideoCover', () => {
  beforeEach(() => {
    clearVideoCoverCache()
    getVideoInfo.mockReset()
  })

  it('返回归一化后的封面原图地址', async () => {
    getVideoInfo.mockResolvedValue({
      code: 0,
      data: { bvid: 'BV1et411h7Ct', aid: 1, title: 't', pic: '//i0.hdslb.com/pic.jpg@672w_378h.webp', duration: 1 }
    })

    await expect(getVideoCover('BV1et411h7Ct')).resolves.toBe('https://i0.hdslb.com/pic.jpg')
  })

  it('同一 BV 号只请求一次', async () => {
    getVideoInfo.mockResolvedValue({
      code: 0,
      data: { bvid: 'BV1et411h7Ct', aid: 1, title: 't', pic: 'https://i0.hdslb.com/pic.jpg', duration: 1 }
    })

    await Promise.all([getVideoCover('BV1et411h7Ct'), getVideoCover('BV1et411h7Ct')])
    await getVideoCover('BV1et411h7Ct')

    expect(getVideoInfo).toHaveBeenCalledTimes(1)
  })

  it('接口返回错误码时返回 null', async () => {
    getVideoInfo.mockResolvedValue({ code: -404, message: '啥都木有' })

    await expect(getVideoCover('BV1et411h7Ct')).resolves.toBeNull()
  })

  it('请求异常时不写缓存，下次可重试', async () => {
    getVideoInfo.mockRejectedValueOnce(new Error('network down'))
    await expect(getVideoCover('BV1et411h7Ct')).rejects.toThrow('network down')

    getVideoInfo.mockResolvedValue({
      code: 0,
      data: { bvid: 'BV1et411h7Ct', aid: 1, title: 't', pic: 'https://i0.hdslb.com/pic.jpg', duration: 1 }
    })
    await expect(getVideoCover('BV1et411h7Ct')).resolves.toBe('https://i0.hdslb.com/pic.jpg')
    expect(getVideoInfo).toHaveBeenCalledTimes(2)
  })
})
