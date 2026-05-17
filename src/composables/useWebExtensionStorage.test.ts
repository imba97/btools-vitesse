const storageState: Record<string, string> = {}
const storageListeners: Array<(changes: Record<string, { newValue: string | null }>) => void> = []

vi.mock('webextension-polyfill', () => {
  return {
    storage: {
      local: {
        remove: vi.fn(async (key: string) => {
          delete storageState[key]
        }),
        set: vi.fn(async (value: Record<string, string>) => {
          Object.assign(storageState, value)
        }),
        get: vi.fn(async (key: string) => {
          return { [key]: storageState[key] }
        })
      },
      onChanged: {
        addListener: vi.fn((listener: (changes: Record<string, { newValue: string | null }>) => void) => {
          storageListeners.push(listener)
        }),
        removeListener: vi.fn((listener: (changes: Record<string, { newValue: string | null }>) => void) => {
          const index = storageListeners.indexOf(listener)
          if (index >= 0)
            storageListeners.splice(index, 1)
        })
      }
    }
  }
})

describe('useWebExtensionStorage', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach((key) => {
      delete storageState[key]
    })
    storageListeners.splice(0, storageListeners.length)
  })

  it('reads existing value without migration compatibility logic', async () => {
    storageState['api.wbi'] = JSON.stringify({ img_key: 'legacy' })

    const { useWebExtensionStorage } = await import('./useWebExtensionStorage')
    const { useStorage } = useWebExtensionStorage('api')

    const state = useStorage('wbi', { img_key: '', sub_key: '', expiration: '' })
    await vi.waitFor(() => {
      expect(state.value).toEqual({ img_key: 'legacy' })
    })
  })
})
