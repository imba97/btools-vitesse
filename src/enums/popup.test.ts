import { describe, expect, it } from 'vitest'
import { buildSearchUrl, ClickSearchInvalid } from './popup'

describe('buildSearchUrl', () => {
  it('returns null for Off (do not intercept click)', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Off, '随便一个标题')).toBeNull()
  })

  it('builds Google URL with {title} replaced and encoded', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Google, '【失效】测试 & 标题'))
      .toBe('https://www.google.com/search?q=%E3%80%90%E5%A4%B1%E6%95%88%E3%80%91%E6%B5%8B%E8%AF%95%20%26%20%E6%A0%87%E9%A2%98')
  })

  it('builds Baidu URL with wd param', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Baidu, 'abc'))
      .toBe('https://www.baidu.com/s?wd=abc')
  })

  it('builds Bing URL with q param', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Bing, 'abc'))
      .toBe('https://www.bing.com/search?q=abc')
  })

  it('uses user-supplied custom template', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'foo', 'https://duckduckgo.com/?q={title}'))
      .toBe('https://duckduckgo.com/?q=foo')
  })

  it('encodes the title in custom template too', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'a b&c', 'https://x.test/?q={title}'))
      .toBe('https://x.test/?q=a%20b%26c')
  })

  it('replaces every occurrence of {title}', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'X', 'https://x.test/?a={title}&b={title}'))
      .toBe('https://x.test/?a=X&b=X')
  })

  it('returns null for Custom when template is empty', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'foo', '')).toBeNull()
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'foo', '   ')).toBeNull()
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'foo')).toBeNull()
  })

  it('returns null for Custom when template does not contain {title} (avoid bare URL)', () => {
    // 没有占位符的模板没有意义——避免误打开固定页面
    expect(buildSearchUrl(ClickSearchInvalid.Custom, 'foo', 'https://x.test/')).toBeNull()
  })

  it('handles empty title (renders URL with empty query)', () => {
    expect(buildSearchUrl(ClickSearchInvalid.Google, ''))
      .toBe('https://www.google.com/search?q=')
  })
})
