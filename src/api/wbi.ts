import { md5 } from 'js-md5'

export interface WbiKeys {
  imgKey: string
  subKey: string
}

const MIXIN_KEY_INDEXES = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52]
const FILTERED_CHARACTERS = /[!'()*]/g

function getMixinKey(keys: WbiKeys): string {
  const source = `${keys.imgKey}${keys.subKey}`
  return MIXIN_KEY_INDEXES.map(index => source[index]).join('').slice(0, 32)
}

export function signWbiParams<T extends object>(
  params: T,
  keys: WbiKeys,
  now = Date.now()
): T & { wts: number, w_rid: string } {
  if (!keys.imgKey || !keys.subKey)
    throw new Error('WBI keys are unavailable.')

  const wts = Math.round(now / 1000)
  const signedParams = { ...params, wts }
  const query = Object.entries(signedParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).replace(FILTERED_CHARACTERS, ''))}`)
    .join('&')

  return {
    ...signedParams,
    w_rid: md5(`${query}${getMixinKey(keys)}`)
  }
}

export function parseWbiKeys(imgUrl: string, subUrl: string): WbiKeys {
  const extractKey = (url: string) => {
    const fileName = new URL(url).pathname.split('/').pop() ?? ''
    return fileName.split('.')[0] ?? ''
  }

  const keys = { imgKey: extractKey(imgUrl), subKey: extractKey(subUrl) }
  if (!keys.imgKey || !keys.subKey)
    throw new Error('The WBI key response is invalid.')
  return keys
}
