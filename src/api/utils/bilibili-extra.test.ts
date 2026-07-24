import { describe, expect, it } from 'vitest'
import {
  biliplusToData,
  biliplusToError
} from './bilibili-extra'

describe('biliplusToData', () => {
  it('maps a successful biliplus payload into BiliplusViewData', () => {
    const data = biliplusToData({
      ver: 2,
      id: 5429996,
      title: '【猫和老鼠】F ! E ! V ! E ! R !',
      description: '自制 边做边笑笑了一天',
      pic: 'https://img.biliplus.com/bfs/archive/abc.jpg',
      author: '冰柚BeYou',
      mid: 27791105,
      created: 1469095181,
      created_at: '2016/07/21 17:59'
    })
    expect(data).toEqual({
      aid: 5429996,
      title: '【猫和老鼠】F ! E ! V ! E ! R !',
      description: '自制 边做边笑笑了一天',
      pic: 'https://img.biliplus.com/bfs/archive/abc.jpg',
      author: '冰柚BeYou',
      mid: 27791105,
      created: 1469095181,
      created_at: '2016/07/21 17:59'
    })
  })

  it('returns null when code is set (error response)', () => {
    expect(biliplusToData({ code: -404, message: '啥都木有', ttl: 1 })).toBeNull()
  })

  it('returns null when title or pic is missing', () => {
    expect(biliplusToData({ id: 1 })).toBeNull()
    expect(biliplusToData({ id: 1, title: 'no pic' })).toBeNull()
    expect(biliplusToData({ id: 1, pic: 'x.jpg' })).toBeNull()
  })

  it('defaults missing optional fields', () => {
    const data = biliplusToData({ id: 1, title: 't', pic: 'p.jpg' })
    expect(data).toEqual({
      aid: 1,
      title: 't',
      description: '',
      pic: 'p.jpg',
      author: '',
      mid: 0,
      created: 0,
      created_at: ''
    })
  })
})

describe('biliplusToError', () => {
  it('preserves code and message', () => {
    expect(biliplusToError({ code: -404, message: '啥都木有', ttl: 1 })).toEqual({
      code: -404,
      message: '啥都木有'
    })
  })

  it('uses -1 as fallback when code is missing', () => {
    expect(biliplusToError({})).toEqual({ code: -1, message: undefined })
  })
})
