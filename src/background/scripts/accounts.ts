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

  const account = _.find(multipleAccountsStorage.accounts.value, accountCookie)

  // eslint-disable-next-line no-console
  console.log('account', account)

  // if (!account)
  //   multipleAccountsStore.accounts.value.push(accountCookie)
}
