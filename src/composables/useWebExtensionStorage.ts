import type {
  StorageLikeAsync,
  UseStorageAsyncOptions
} from '@vueuse/core'
import type { MaybeRefOrGetter, RemovableRef } from '@vueuse/shared'
import type { Ref } from 'vue-demi'
import type { Storage } from 'webextension-polyfill'

import { StorageSerializers } from '@vueuse/core'
import { pausableWatch, tryOnScopeDispose } from '@vueuse/shared'
import { ref, shallowRef } from 'vue-demi'
import { storage } from 'webextension-polyfill'

export type WebExtensionStorageOptions<T> = UseStorageAsyncOptions<T>

// https://github.com/vueuse/vueuse/blob/658444bf9f8b96118dbd06eba411bb6639e24e88/packages/core/useStorage/guess.ts
export function guessSerializerType(rawInit: unknown) {
  return rawInit == null
    ? 'any'
    : rawInit instanceof Set
      ? 'set'
      : rawInit instanceof Map
        ? 'map'
        : rawInit instanceof Date
          ? 'date'
          : typeof rawInit === 'boolean'
            ? 'boolean'
            : typeof rawInit === 'string'
              ? 'string'
              : typeof rawInit === 'object'
                ? 'object'
                : Number.isNaN(rawInit)
                  ? 'any'
                  : 'number'
}

const storageInterface: StorageLikeAsync = {
  removeItem(key: string) {
    return storage.local.remove(key)
  },

  setItem(key: string, value: string) {
    return storage.local.set({ [key]: value })
  },

  async getItem(key: string) {
    const storedData = await storage.local.get(key)

    return storedData[key] as string
  }
}

/**
 * @param key
 * @param initialValue
 * @param options
 */
function createStorage<T>(
  key: string,
  initialValue: MaybeRefOrGetter<T>,
  options: WebExtensionStorageOptions<T> = {}
): RemovableRef<T> {
  const {
    flush = 'pre',
    deep = true,
    listenToStorageChanges = true,
    writeDefaults = true,
    mergeDefaults = false,
    shallow,
    eventFilter,
    onError = (e) => {
      console.error(e)
    }
  } = options

  const rawInit: T = toValue(initialValue)
  const type = guessSerializerType(rawInit)

  const data = (shallow ? shallowRef : ref)(initialValue) as Ref<T>
  const serializer = options.serializer ?? StorageSerializers[type]

  async function read(event?: { key: string, newValue: string | null }) {
    if (event && event.key !== key)
      return

    try {
      const rawValue = event ? event.newValue : await storageInterface.getItem(key)
      if (rawValue == null) {
        data.value = rawInit
        if (writeDefaults && rawInit !== null)
          await storageInterface.setItem(key, await serializer.write(rawInit))
      }
      else if (mergeDefaults) {
        const value = await serializer.read(rawValue) as T
        if (typeof mergeDefaults === 'function')
          data.value = mergeDefaults(value, rawInit)
        else if (type === 'object' && !Array.isArray(value))
          data.value = { ...(rawInit as Record<keyof unknown, unknown>), ...(value as Record<keyof unknown, unknown>) } as T
        else data.value = value
      }
      else {
        data.value = await serializer.read(rawValue) as T
      }
    }
    catch (error) {
      onError(error)
    }
  }

  void read()

  async function write() {
    try {
      await (
        data.value == null
          ? storageInterface.removeItem(key)
          : storageInterface.setItem(key, await serializer.write(data.value))
      )
    }
    catch (error) {
      onError(error)
    }
  }

  const { pause: pauseWatch, resume: resumeWatch } = pausableWatch(
    data,
    write,
    {
      flush,
      deep,
      eventFilter
    }
  )

  if (listenToStorageChanges) {
    const listener = async (changes: Record<string, Storage.StorageChange>) => {
      try {
        pauseWatch()
        for (const [key, change] of Object.entries(changes)) {
          await read({
            key,
            newValue: change.newValue as string | null
          })
        }
      }
      finally {
        resumeWatch()
      }
    }

    storage.onChanged.addListener(listener)

    tryOnScopeDispose(() => {
      storage.onChanged.removeListener(listener)
    })
  }

  return data as RemovableRef<T>
}

export function useWebExtensionStorage(type: string) {
  return {
    useStorage<T>(
      key: string,
      initialValue: MaybeRefOrGetter<T>,
      options: WebExtensionStorageOptions<T> = {}
    ): RemovableRef<T> {
      return createStorage<T>(
        `${type}.${key}`,
        initialValue,
        options
      )
    }
  }
}
