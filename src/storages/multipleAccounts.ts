import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

interface Account {
  uid: string
  name: string
  SESSDATA: string
  bili_jct: string
  DedeUserID: string
  DedeUserID__ckMd5: string
}

export const multipleAccountsStorage = {
  accounts: useWebExtensionStorage<Account[]>('accounts', []),
}
