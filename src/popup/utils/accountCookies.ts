import type { Account } from '~/storages/multipleAccounts'
import dayjs from 'dayjs'

const ACCOUNT_COOKIE_NAMES = [
  'SESSDATA',
  'bili_jct',
  'DedeUserID',
  'DedeUserID__ckMd5'
] as const

const COOKIE_DOMAIN = '.bilibili.com'
const COOKIE_URL = 'https://bilibili.com'

function createDefaultCookie(name: (typeof ACCOUNT_COOKIE_NAMES)[number]) {
  return {
    domain: COOKIE_DOMAIN,
    expirationDate: dayjs().add(180, 'days').valueOf() / 1000,
    httpOnly: name === 'SESSDATA',
    path: '/',
    sameSite: 'unspecified' as any,
    secure: false,
    storeId: '0'
  }
}

export async function setBilibiliAccountCookies(account?: Account) {
  const cookies = await browser.cookies.getAll({ domain: COOKIE_DOMAIN })
  const tasks = ACCOUNT_COOKIE_NAMES.map((name) => {
    const currentCookie = _find(cookies, { name })
    const fallbackCookie = createDefaultCookie(name)

    return browser.cookies.set({
      url: COOKIE_URL,
      domain: currentCookie?.domain || fallbackCookie.domain,
      expirationDate: currentCookie?.expirationDate ?? fallbackCookie.expirationDate,
      httpOnly: currentCookie?.httpOnly ?? fallbackCookie.httpOnly,
      name,
      path: currentCookie?.path || fallbackCookie.path,
      sameSite: currentCookie?.sameSite ?? fallbackCookie.sameSite,
      secure: currentCookie?.secure ?? fallbackCookie.secure,
      storeId: currentCookie?.storeId || fallbackCookie.storeId,
      value: _get(account, name, '')
    })
  })

  await Promise.all(tasks)
}

interface AccountCookieSwitcherOptions {
  writeCookies: (account?: Account) => Promise<void>
  setCurrentAccount: (DedeUserID: string) => void
  onSwitchingChange?: (isSwitching: boolean) => void
}

export function createAccountCookieSwitcher(options: AccountCookieSwitcherOptions) {
  let cookieWriteTask = Promise.resolve()

  const runExclusive = async (task: () => Promise<void>) => {
    const currentTask = cookieWriteTask.then(async () => {
      options.onSwitchingChange?.(true)
      try {
        await task()
      }
      finally {
        options.onSwitchingChange?.(false)
      }
    })

    cookieWriteTask = currentTask.catch(() => undefined)
    await currentTask
  }

  return {
    async changeAccount(account: Account) {
      await runExclusive(async () => {
        await options.writeCookies(account)
        options.setCurrentAccount(account.DedeUserID)
      })
    },
    async leaveAccount() {
      await runExclusive(async () => {
        await options.writeCookies()
        options.setCurrentAccount('')
      })
    }
  }
}
