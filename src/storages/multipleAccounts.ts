import { createStorageRepository } from './repository'

export interface Account {
  name: string
  face: string
  SESSDATA: string
  bili_jct: string
  DedeUserID: string
  DedeUserID__ckMd5: string
}

export const multipleAccountsStorage = {
  currentAccount: createStorageRepository<string>('multipleAccounts.currentAccount', ''),
  accounts: createStorageRepository<Account[]>('multipleAccounts.accounts', [])
}
