import { beforeEach, describe, expect, it } from 'vitest'
import {
  extractBvid,
  isInvalidCard,
  patchCard,
  toHttps
} from './favorites-recovery'

function makeCard(html: string): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html.trim()
  return wrapper.firstElementChild as HTMLElement
}

// 现代 B 站卡片结构：cover 是包裹 div，img 嵌在 thumbnail 子层里
function makeModernCard(opts: {
  bvid?: string
  imgAlt?: string
  anchorText?: string
  cardClass?: string
  titleWrapperText?: string
}): HTMLElement {
  const { bvid = 'BV1wT4y137DS', imgAlt = '', anchorText = '', cardClass = '', titleWrapperText } = opts
  const titleBlock = titleWrapperText !== undefined
    ? `<div class="bili-video-card__title bili-video-card__title--pr">${titleWrapperText}</div>`
    : `<div class="bili-video-card__title bili-video-card__title--pr">
          <a href="https://www.bilibili.com/video/${bvid}">${anchorText}</a>
        </div>`
  return makeCard(`
    <div class="bili-video-card ${cardClass}">
      <div class="bili-video-card__cover">
        <a href="https://www.bilibili.com/video/${bvid}">
          <div class="bili-cover-card__thumbnail">
            <img class="b-img__inner" alt="${imgAlt}" />
          </div>
        </a>
      </div>
      <div class="bili-video-card__details">
        ${titleBlock}
      </div>
    </div>
  `)
}

describe('toHttps', () => {
  it('upgrades http:// to https://', () => {
    expect(toHttps('http://i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
  })

  it('prepends https: to protocol-relative urls', () => {
    expect(toHttps('//i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
  })

  it('leaves https urls untouched', () => {
    expect(toHttps('https://i0.hdslb.com/pic.jpg')).toBe('https://i0.hdslb.com/pic.jpg')
  })
})

describe('extractBvid', () => {
  it('extracts BV id from a clean url', () => {
    expect(extractBvid('https://www.bilibili.com/video/BV1wT4y137DS')).toBe('BV1wT4y137DS')
  })

  it('extracts BV id from a url with query string', () => {
    expect(extractBvid('https://www.bilibili.com/video/BV1wT4y137DS?spm_id_from=333.1387.favlist.content.click')).toBe('BV1wT4y137DS')
  })

  it('extracts BV id from a protocol-relative url', () => {
    expect(extractBvid('//www.bilibili.com/video/BV1wT4y137DS/')).toBe('BV1wT4y137DS')
  })

  it('returns null for null/empty/unrelated href', () => {
    expect(extractBvid(null)).toBeNull()
    expect(extractBvid('')).toBeNull()
    expect(extractBvid('https://example.com/no-bv-here')).toBeNull()
  })

  it('returns null when BV id is too short', () => {
    expect(extractBvid('https://www.bilibili.com/video/BV1wT')).toBeNull()
  })
})

describe('isInvalidCard', () => {
  // ───── 主信号：封面 img.alt ─────
  it('matches via img.alt = "已失效视频" (primary signal)', () => {
    const card = makeModernCard({ imgAlt: '已失效视频' })
    expect(isInvalidCard(card)).toBe(true)
  })

  it('matches via img.alt = "已删除视频"', () => {
    const card = makeModernCard({ imgAlt: '已删除视频' })
    expect(isInvalidCard(card)).toBe(true)
  })

  it('matches via img.alt = "视频已失效"', () => {
    const card = makeModernCard({ imgAlt: '视频已失效' })
    expect(isInvalidCard(card)).toBe(true)
  })

  it('does NOT match a valid card whose img.alt is the real video title', () => {
    const card = makeModernCard({ imgAlt: '【失效分析】为什么我的接口失效了', anchorText: '【失效分析】为什么我的接口失效了' })
    expect(isInvalidCard(card)).toBe(false)
  })

  it('does NOT match when img.alt is empty (placeholder alt is required)', () => {
    const card = makeModernCard({ imgAlt: '', anchorText: '正常视频标题' })
    expect(isInvalidCard(card)).toBe(false)
  })

  // ───── 兜底：失效标记类 ─────
  it('matches the historical li.small-item.disabled ancestor', () => {
    const card = makeCard('<li class="small-item disabled"><a href="https://www.bilibili.com/video/BV1xx411c7mD">已失效视频</a></li>')
    expect(isInvalidCard(card)).toBe(true)
  })

  it('matches modern disabled class on the card itself', () => {
    const card = makeCard('<div class="bili-video-card disabled"><a href="https://www.bilibili.com/video/BV1xx411c7mD"></a></div>')
    expect(isInvalidCard(card)).toBe(true)
  })

  // ───── 兜底：标题区域提示 / 为空 ─────
  it('matches when title wrapper text contains "不见了" placeholder', () => {
    const card = makeModernCard({ titleWrapperText: '<a href="https://www.bilibili.com/video/BV1xx411c7mD">视频不见了</a>' })
    expect(isInvalidCard(card)).toBe(true)
  })

  it('matches when title wrapper is empty even if anchor has BV', () => {
    const card = makeModernCard({ titleWrapperText: '<a href="https://www.bilibili.com/video/BV1xx411c7mD"></a>' })
    expect(isInvalidCard(card)).toBe(true)
  })

  // ───── 兜底：完全无 anchor ─────
  it('matches when card has no title anchor at all', () => {
    const card = makeCard('<div class="bili-video-card">没有任何链接</div>')
    expect(isInvalidCard(card)).toBe(true)
  })
})

describe('patchCard', () => {
  let card: HTMLElement
  beforeEach(() => {
    card = makeModernCard({ bvid: 'BV1wT4y137DS', imgAlt: '已失效视频', anchorText: '' })
  })

  it('writes title into anchor, updates nested img src+alt, and sets wrapper tooltip', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 123,
      title: '找回后的真实标题',
      pic: 'http://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    const a = card.querySelector<HTMLAnchorElement>('.bili-video-card__title--pr > a')!
    const wrapper = card.querySelector('.bili-video-card__title--pr')!
    const nestedImg = card.querySelector<HTMLImageElement>('.bili-cover-card__thumbnail img.b-img__inner')!
    expect(a.textContent).toBe('找回后的真实标题')
    expect(wrapper.getAttribute('title')).toBe('找回后的真实标题')
    expect(nestedImg.getAttribute('src')).toBe('https://i0.hdslb.com/bfs/cover.jpg')
    expect(nestedImg.alt).toBe('找回后的真实标题') // 关键：alt 也得改，否则下次 scan 又判定为失效
  })

  it('always overwrites anchor text (B 站失效卡片 a 里直接渲染了非空占位文本，必须覆盖)', () => {
    const a = card.querySelector<HTMLAnchorElement>('.bili-video-card__title--pr > a')!
    a.textContent = '已失效视频'
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '接口返回的标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    expect(a.textContent).toBe('接口返回的标题')
    expect(card.querySelector('.bili-video-card__title--pr')!.getAttribute('title')).toBe('接口返回的标题')
  })

  it('applies bold + red inline style to patched anchor (visual hint)', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '找回后的真实标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    const a = card.querySelector<HTMLAnchorElement>('.bili-video-card__title--pr > a')!
    expect(a.style.getPropertyValue('font-weight')).toBe('bold')
    // 浏览器会把 hex 归一化成 rgb()，断言用归一化形式
    expect(a.style.getPropertyValue('color')).toBe('rgb(239, 68, 68)')
    expect(a.style.getPropertyPriority('font-weight')).toBe('important')
    expect(a.style.getPropertyPriority('color')).toBe('important')
  })

  it('writes real title into card dataset (so any <a> inside — title or cover — can read it)', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '真实标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    // 关键：写在 card 上（不在 title <a> 上）——封面 <a> 点击也能读到
    expect(card.dataset.btoolsTitle).toBe('真实标题')
    const titleA = card.querySelector<HTMLAnchorElement>('.bili-video-card__title--pr > a')!
    expect(titleA.dataset.btoolsTitle).toBeUndefined()
  })

  it('card dataset survives textContent being cleared on title <a> by re-render', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '保留的标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    const titleA = card.querySelector<HTMLAnchorElement>('.bili-video-card__title--pr > a')!
    // 模拟 B 站 re-render 把 title a 的 textContent 清空
    titleA.textContent = ''
    expect(titleA.textContent).toBe('')
    // 卡片 dataset 不变
    expect(card.dataset.btoolsTitle).toBe('保留的标题')
  })

  it('click on cover <a> can also resolve the title via card dataset (covers the second anchor)', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '封面点击也有效',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    // 封面 <a> 本身没 dataset，但它的祖先 card 有 → 点击封面仍能拿到真标题
    const coverA = card.querySelector<HTMLAnchorElement>('.bili-video-card__cover > a')!
    expect(coverA.dataset.btoolsTitle).toBeUndefined()
    expect(coverA.closest<HTMLElement>('.bili-video-card')!.dataset.btoolsTitle).toBe('封面点击也有效')
    // 封面 <a> 的 textContent 是空（里面只有 img）—— 所以靠 textContent 走不通
    expect(coverA.textContent?.trim()).toBe('')
  })

  it('is idempotent (running twice does not re-trigger mutations)', () => {
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '稳定标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    const firstSrc = card.querySelector<HTMLImageElement>('.bili-cover-card__thumbnail img')!.getAttribute('src')
    patchCard(card, {
      bvid: 'BV1wT4y137DS',
      aid: 1,
      title: '稳定标题',
      pic: 'https://i0.hdslb.com/bfs/cover.jpg',
      duration: 0
    })
    const secondSrc = card.querySelector<HTMLImageElement>('.bili-cover-card__thumbnail img')!.getAttribute('src')
    expect(firstSrc).toBe(secondSrc)
  })
})
