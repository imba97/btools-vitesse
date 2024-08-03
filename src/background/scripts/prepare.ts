import moment from 'moment'
import BilibiliApi from '~/api/bilibili'
import { apiStorage } from '~/storages/api'

;

(async () => {
  const today = moment().format('YYYYMMDD')

  if (today !== apiStorage.wbi.value.expiration) {
    const wbi = await getWbiKeys()

    apiStorage.wbi.value = {
      img_key: wbi.img_key,
      sub_key: wbi.sub_key,
      expiration: today,
    }
  }
})()

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
  const response = await BilibiliApi.getNav()

  const { data: { wbi_img: { img_url, sub_url } } } = response

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.'),
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.'),
    ),
  }
}
