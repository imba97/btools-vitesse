import { BackgroundMessageType, isAllowedFetchUrl, isBackgroundRequest } from './background'

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn()
    }
  }
}))

describe('background protocol', () => {
  it('recognizes only supported runtime requests', () => {
    expect(isBackgroundRequest({ type: BackgroundMessageType.ping })).toBe(true)
    expect(isBackgroundRequest({ type: BackgroundMessageType.fetchText, url: 'https://www.biliplus.com/api/view?id=1' })).toBe(true)
    expect(isBackgroundRequest({ type: BackgroundMessageType.fetchText })).toBe(false)
    expect(isBackgroundRequest({ type: 'unknown' })).toBe(false)
  })

  it('allows only HTTPS requests to approved origins', () => {
    expect(isAllowedFetchUrl('https://www.biliplus.com/api/view?id=1')).toBe(true)
    expect(isAllowedFetchUrl('http://www.biliplus.com/api/view?id=1')).toBe(false)
    expect(isAllowedFetchUrl('https://www.biliplus.com.evil.example/api/view')).toBe(false)
    expect(isAllowedFetchUrl('https://example.com')).toBe(false)
    expect(isAllowedFetchUrl('not a url')).toBe(false)
  })
})
