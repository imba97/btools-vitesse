import { describe, expect, it } from 'vitest'
import { parseWbiKeys, signWbiParams } from './wbi'

describe('wbi utilities', () => {
  const keys = {
    imgKey: '7cd084941338484aae1ad9425b84077c',
    subKey: '4932caff0ff746eab6f01bf08b70ac45'
  }

  it('creates a deterministic signature without changing caller parameters', () => {
    const params = { mid: 123, keyword: 'a!\'()*b' }
    const result = signWbiParams(params, keys, 1_700_000_000_000)

    expect(params).toEqual({ mid: 123, keyword: 'a!\'()*b' })
    expect(result).toMatchObject({ mid: 123, keyword: 'a!\'()*b', wts: 1_700_000_000 })
    expect(result.w_rid).toHaveLength(32)
    expect(result.w_rid).toBe(signWbiParams(params, keys, 1_700_000_000_000).w_rid)
  })

  it('parses WBI keys from image URLs', () => {
    expect(parseWbiKeys(
      'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png',
      'https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png'
    )).toEqual(keys)
  })
})
