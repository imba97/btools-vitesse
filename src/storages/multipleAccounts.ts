import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export interface Account {
  name: string
  face: string
  SESSDATA: string
  bili_jct: string
  DedeUserID: string
  DedeUserID__ckMd5: string
}

const { useStorage } = useWebExtensionStorage('multipleAccounts')

export const multipleAccountsStorage = {
  currentAccount: useStorage<string>('currentAccount', ''),
  accounts: useStorage<Account[]>('accounts', [])
}
