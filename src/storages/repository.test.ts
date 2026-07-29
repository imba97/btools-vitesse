import { createStorageRepository } from './repository'

const { storageState, storageListeners } = vi.hoisted(() => ({
  storageState: {} as Record<string, unknown>,
  storageListeners: [] as Array<(changes: Record<string, { newValue: unknown }>, areaName: string) => void>
}))

vi.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
      set: vi.fn(async (next: Record<string, unknown>) => {
        Object.assign(storageState, next)
      })
    },
    onChanged: {
      addListener: vi.fn((listener: (changes: Record<string, { newValue: unknown }>, areaName: string) => void) => storageListeners.push(listener))
    }
  }
}))

describe('createStorageRepository', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach(key => delete storageState[key])
    storageListeners.splice(0, storageListeners.length)
  })

  it('reads legacy JSON strings and writes native extension storage values', async () => {
    storageState['test.setting'] = JSON.stringify({ enabled: true })
    const repository = createStorageRepository('test.setting', { enabled: false })

    await repository.ready
    expect(repository.value.value).toEqual({ enabled: true })

    await repository.set({ enabled: false })
    expect(storageState['test.setting']).toEqual({ enabled: false })
  })

  it('serializes updates and applies external storage changes', async () => {
    const repository = createStorageRepository('test.count', 0)
    await repository.ready

    const first = repository.update(value => value + 1)
    const second = repository.update(value => value + 1)
    await Promise.all([first, second])
    expect(storageState['test.count']).toBe(2)

    storageListeners[0]?.({ 'test.count': { newValue: 9 } }, 'local')
    expect(repository.value.value).toBe(9)
  })
})
