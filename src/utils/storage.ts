import type { StorageRepository } from '~/storages/repository'

export function withComputed<T>(repository: StorageRepository<T>) {
  return computed<T>({
    get() {
      return repository.value.value
    },
    set(value) {
      void repository.set(value)
    }
  })
}
