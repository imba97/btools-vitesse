import dayjs from 'dayjs'
import { apiStorage } from '~/storages/api'
import { useRequest } from './request'
import { parseWbiKeys } from './wbi'

const request = useRequest('https://api.bilibili.com/x')
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 500
let refreshTask: Promise<void> | undefined

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function fetchWbiKeys() {
  const response = await request.get<{ data: { wbi_img: { img_url: string, sub_url: string } } }>('/web-interface/nav')
  return parseWbiKeys(response.data.wbi_img.img_url, response.data.wbi_img.sub_url)
}

export async function ensureWbiKeys(force = false): Promise<{ imgKey: string, subKey: string }> {
  await apiStorage.wbi.ready
  const today = dayjs().format('YYYYMMDD')
  const cached = apiStorage.wbi.value.value
  if (!force && cached.expiration === today && cached.img_key && cached.sub_key) {
    return { imgKey: cached.img_key, subKey: cached.sub_key }
  }

  if (!refreshTask) {
    refreshTask = (async () => {
      let lastError: unknown
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          const keys = await fetchWbiKeys()
          await apiStorage.wbi.set({
            img_key: keys.imgKey,
            sub_key: keys.subKey,
            expiration: today
          })
          return
        }
        catch (error) {
          lastError = error
          if (attempt < MAX_RETRIES)
            await wait(RETRY_DELAY_MS * (attempt + 1))
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Unable to refresh WBI keys.')
    })().finally(() => {
      refreshTask = undefined
    })
  }

  await refreshTask
  const refreshed = apiStorage.wbi.value.value
  return { imgKey: refreshed.img_key, subKey: refreshed.sub_key }
}
