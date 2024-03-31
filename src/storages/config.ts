import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export const configStorage = {
  accountChangeConfirm: useWebExtensionStorage<boolean>('accountChangeConfirm', false),
}
