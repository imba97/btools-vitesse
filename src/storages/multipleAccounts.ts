import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export interface Account {
  name: string
  face: string
  SESSDATA: string
  bili_jct: string
  DedeUserID: string
  DedeUserID__ckMd5: string
}

export const multipleAccountsStorage = {
  currentAccount: useWebExtensionStorage<string>('currentAccount', ''),
  accounts: useWebExtensionStorage<Account[]>('accounts', []),
}
