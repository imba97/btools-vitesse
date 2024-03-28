import BilibiliApi from '~/api/bilibili'
import { multipleAccountsStorage } from '~/storages/multipleAccounts'

export const getCurrentAccount = async () => {
  const cookies = await browser.cookies.getAll({
    domain: '.bilibili.com',
  })

  const accountCookieNames = [
    'SESSDATA',
    'bili_jct',
    'DedeUserID',
    'DedeUserID__ckMd5',
  ]

  const accountCookie: { [key: string]: string | undefined } = {}

  _.forEach(accountCookieNames, (key) => {
    const cookie = _.find(cookies, { name: key })

    accountCookie[key] = cookie?.value
  })

  // 设置当前账号 UID
  multipleAccountsStorage.currentAccount.value = _.get(accountCookie, 'DedeUserID', '')

  console.log('currentAccount', multipleAccountsStorage.currentAccount.value)

  console.log(multipleAccountsStorage.accounts.value)

  // 已登录
  if (accountCookie.DedeUserID) {
    const account = _.find(multipleAccountsStorage.accounts.value, {
      DedeUserID: accountCookie.DedeUserID,
    })

    if (!account) {
      const userInfo = await BilibiliApi.getUserInfo(accountCookie.DedeUserID)

      multipleAccountsStorage.accounts.value.push({
        name: _.get(userInfo, 'data.name', ''),
        face: _.get(userInfo, 'data.face', ''),
        SESSDATA: accountCookie.SESSDATA!,
        bili_jct: accountCookie.bili_jct!,
        DedeUserID: accountCookie.DedeUserID!,
        DedeUserID__ckMd5: accountCookie.DedeUserID__ckMd5!,
      })
    }
    else {
      console.log('account', account)
    }
  }
  else {
    console.log('未登录')
  }
}
