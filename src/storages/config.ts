import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

const { useStorage } = useWebExtensionStorage('config')

export const configStorage = {
  accountChangeConfirm: useStorage<boolean>('accountChangeConfirm', false)
}
