const runtimeOnInstalledListeners: Array<() => void> = []
const runtimeOnStartupListeners: Array<() => void> = []
const runtimeOnMessageListeners: Array<(message: unknown, sender: unknown) => unknown> = []
const alarmsOnAlarmListeners: Array<(alarm: { name: string }) => void> = []

const getCurrentAccount = vi.fn()
const refreshWbiIfNeeded = vi.fn(async () => true)

vi.mock('webextension-polyfill', () => {
  const browser = {
    runtime: {
      id: 'test-extension',
      onInstalled: {
        addListener: (listener: () => void) => runtimeOnInstalledListeners.push(listener)
      },
      onStartup: {
        addListener: (listener: () => void) => runtimeOnStartupListeners.push(listener)
      },
      onMessage: {
        addListener: (listener: (message: unknown, sender: unknown) => unknown) => runtimeOnMessageListeners.push(listener)
      }
    },
    tabs: {},
    alarms: {
      onAlarm: {
        addListener: (listener: (alarm: { name: string }) => void) => alarmsOnAlarmListeners.push(listener)
      },
      clear: vi.fn(async () => true),
      create: vi.fn()
    },
    webNavigation: {
      onCommitted: {
        addListener: vi.fn()
      }
    },
    storage: {
      local: {
        remove: vi.fn(async () => undefined),
        set: vi.fn(async () => undefined),
        get: vi.fn(async () => ({}))
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  }

  return {
    default: browser,
    storage: browser.storage
  }
})

vi.mock('./scripts/accounts', () => {
  return { getCurrentAccount }
})

vi.mock('./scripts/prepare', () => {
  return { refreshWbiIfNeeded }
})

describe('background main integration', () => {
  beforeEach(async () => {
    vi.resetModules()
    getCurrentAccount.mockReset()
    refreshWbiIfNeeded.mockReset()
    refreshWbiIfNeeded.mockResolvedValue(true)

    runtimeOnInstalledListeners.splice(0, runtimeOnInstalledListeners.length)
    runtimeOnStartupListeners.splice(0, runtimeOnStartupListeners.length)
    runtimeOnMessageListeners.splice(0, runtimeOnMessageListeners.length)
    alarmsOnAlarmListeners.splice(0, alarmsOnAlarmListeners.length)

    await import('./main')
  })

  it('registers startup and alarm behaviors', async () => {
    // main.ts 注册 1 个 + cache-cleanup.ts 注册 1 个
    expect(runtimeOnInstalledListeners).toHaveLength(2)
    expect(runtimeOnStartupListeners).toHaveLength(2)
    expect(runtimeOnMessageListeners).toHaveLength(1)
    expect(alarmsOnAlarmListeners).toHaveLength(1)

    runtimeOnInstalledListeners[0]?.()
    await vi.waitFor(() => {
      expect(getCurrentAccount).toHaveBeenCalledTimes(1)
      expect(refreshWbiIfNeeded).toHaveBeenCalledWith(true)
    })
  })

  it('refreshes wbi when alarm triggers', async () => {
    alarmsOnAlarmListeners[0]?.({ name: 'btools.refreshWbi' })

    await vi.waitFor(() => {
      expect(refreshWbiIfNeeded).toHaveBeenCalledWith(true)
    })
  })
})
