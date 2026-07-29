import BilibiliApi from '~/api/bilibili'
import { multipleAccountsStorage } from '~/storages/multipleAccounts'

export async function getCurrentAccount() {
  await Promise.all([
    multipleAccountsStorage.currentAccount.ready,
    multipleAccountsStorage.accounts.ready
  ])
  const cookies = await browser.cookies.getAll({
    domain: '.bilibili.com'
  })

  const accountCookieNames = [
    'SESSDATA',
    'bili_jct',
    'DedeUserID',
    'DedeUserID__ckMd5'
  ]

  const accountCookie: { [key: string]: string | undefined } = {}

  _forEach(accountCookieNames, (key) => {
    const cookie = _find(cookies, { name: key })

    accountCookie[key] = cookie?.value
  })

  // 设置当前账号 UID
  await multipleAccountsStorage.currentAccount.set(_get(accountCookie, 'DedeUserID', ''))

  // 已登录
  if (accountCookie.DedeUserID) {
    const account = _find(multipleAccountsStorage.accounts.value.value, {
      DedeUserID: accountCookie.DedeUserID
    })

    const isNotData = [account?.name, account?.face].some(_isEmpty)

    if (isNotData) {
      await multipleAccountsStorage.accounts.update(accounts => accounts.filter(item => item.DedeUserID !== accountCookie.DedeUserID))
    }

    if (!account || isNotData) {
      const userInfo = await BilibiliApi.getUserInfo(accountCookie.DedeUserID)

      await multipleAccountsStorage.accounts.update(accounts => [...accounts, {
        name: _get(userInfo, 'data.name', ''),
        face: _get(userInfo, 'data.face', ''),
        SESSDATA: accountCookie.SESSDATA!,
        bili_jct: accountCookie.bili_jct!,
        DedeUserID: accountCookie.DedeUserID!,
        DedeUserID__ckMd5: accountCookie.DedeUserID__ckMd5!
      }])
    }
  }
}
