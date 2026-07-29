import type { ShallowRef } from 'vue'
import { shallowRef } from 'vue'
import { storage } from 'webextension-polyfill'

export interface StorageRepository<T> {
  readonly key: string
  readonly value: Readonly<ShallowRef<T>>
  readonly ready: Promise<void>
  set: (value: T) => Promise<void>
  update: (updater: (current: T) => T) => Promise<void>
}

export interface StorageRepositoryOptions<T> {
  normalize?: (value: unknown, fallback: T) => T
}

function decodeStoredValue(value: unknown): unknown {
  if (typeof value !== 'string')
    return value
  try {
    return JSON.parse(value)
  }
  catch {
    return value
  }
}

export function createStorageRepository<T>(
  key: string,
  initialValue: T,
  options: StorageRepositoryOptions<T> = {}
): StorageRepository<T> {
  const value = shallowRef(initialValue) as ShallowRef<T>
  const normalize = options.normalize ?? ((stored: unknown, fallback: T) => stored === undefined ? fallback : stored as T)
  let hasLocalMutation = false
  let writeQueue = Promise.resolve()

  const ready = storage.local.get(key).then((stored) => {
    if (!hasLocalMutation)
      value.value = normalize(decodeStoredValue(stored[key]), initialValue)
  }).catch(() => {})

  function enqueueWrite(snapshot: T): Promise<void> {
    hasLocalMutation = true
    writeQueue = writeQueue.then(async () => {
      await ready
      await storage.local.set({ [key]: snapshot })
    })
    return writeQueue
  }

  async function set(next: T): Promise<void> {
    value.value = next
    await enqueueWrite(next)
  }

  async function update(updater: (current: T) => T): Promise<void> {
    await set(updater(value.value))
  }

  storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[key])
      return
    value.value = normalize(decodeStoredValue(changes[key].newValue), initialValue)
  })

  return { key, value, ready, set, update }
}
