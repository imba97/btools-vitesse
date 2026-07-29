import { createStorageRepository } from './repository'

export const configStorage = {
  accountChangeConfirm: createStorageRepository<boolean>('config.accountChangeConfirm', false)
}
