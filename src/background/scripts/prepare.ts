import dayjs from 'dayjs'
import BilibiliApi from '~/api/bilibili'
import { apiStorage } from '~/storages/api'

const WBI_MAX_RETRIES = 2
const WBI_RETRY_DELAY_MS = 500

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function refreshWbiIfNeeded(force = false) {
  const today = dayjs().format('YYYYMMDD')

  if (!force && today === apiStorage.wbi.value.expiration) {
    return false
  }

  for (let attempt = 0; attempt <= WBI_MAX_RETRIES; attempt += 1) {
    try {
      const wbi = await getWbiKeys()

      apiStorage.wbi.value = {
        img_key: wbi.img_key,
        sub_key: wbi.sub_key,
        expiration: today
      }
      return true
    }
    catch (error) {
      const isLastAttempt = attempt === WBI_MAX_RETRIES
      if (isLastAttempt) {
        console.error('[background] failed to refresh WBI keys', error)
        return false
      }

      await wait(WBI_RETRY_DELAY_MS * (attempt + 1))
    }
  }

  return false
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
  const response = await BilibiliApi.getNav() as {
    data: {
      wbi_img: {
        img_url: string
        sub_url: string
      }
    }
  }

  const { data: { wbi_img: { img_url, sub_url } } } = response

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.')
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.')
    )
  }
}
