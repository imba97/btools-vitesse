import { createAccountCookieSwitcher, setBilibiliAccountCookies } from './accountCookies'

const { cookieGetAll, cookieSet } = vi.hoisted(() => {
  return {
    cookieGetAll: vi.fn(),
    cookieSet: vi.fn()
  }
})

vi.mock('webextension-polyfill', () => {
  return {
    default: {
      cookies: {
        getAll: cookieGetAll,
        set: cookieSet
      }
    }
  }
})

describe('accountCookies', () => {
  beforeEach(() => {
    cookieGetAll.mockReset()
    cookieSet.mockReset()
  })

  it('waits all bilibili cookie writes before resolve', async () => {
    cookieGetAll.mockResolvedValue([])

    const resolvers: Array<() => void> = []
    cookieSet.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolvers.push(resolve)
      })
    })

    const task = setBilibiliAccountCookies({
      name: 'user-a',
      face: 'face-a',
      SESSDATA: 'sess-a',
      bili_jct: 'csrf-a',
      DedeUserID: '10001',
      DedeUserID__ckMd5: 'md5-a'
    })

    await Promise.resolve()
    expect(cookieSet).toHaveBeenCalledTimes(4)
    expect(cookieSet).toHaveBeenCalledWith(expect.objectContaining({ domain: '.bilibili.com' }))

    let isResolved = false
    void task.then(() => {
      isResolved = true
    })

    resolvers.slice(0, 3).forEach(resolve => resolve())
    await Promise.resolve()
    expect(isResolved).toBe(false)

    resolvers[3]!()
    await task
    expect(isResolved).toBe(true)
  })

  it('serializes leave then switch, keeping final account value', async () => {
    let resolveLeave: (() => void) | undefined
    const current = { value: 'initial' }
    const writeOrder: string[] = []
    const switchingStates: boolean[] = []

    const switcher = createAccountCookieSwitcher({
      writeCookies: async (account) => {
        if (!account) {
          writeOrder.push('leave')
          await new Promise<void>((resolve) => {
            resolveLeave = resolve
          })
          return
        }

        writeOrder.push(`switch:${account.DedeUserID}`)
      },
      setCurrentAccount: DedeUserID => (current.value = DedeUserID),
      onSwitchingChange: value => switchingStates.push(value)
    })

    const leaveTask = switcher.leaveAccount()
    const switchTask = switcher.changeAccount({
      name: 'user-b',
      face: 'face-b',
      SESSDATA: 'sess-b',
      bili_jct: 'csrf-b',
      DedeUserID: '20002',
      DedeUserID__ckMd5: 'md5-b'
    })

    await Promise.resolve()
    expect(writeOrder).toEqual(['leave'])
    expect(current.value).toBe('initial')

    resolveLeave?.()
    await leaveTask
    await switchTask

    expect(writeOrder).toEqual(['leave', 'switch:20002'])
    expect(current.value).toBe('20002')
    expect(switchingStates).toEqual([true, false, true, false])
  })
})
