import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

interface Wbi {
  img_key: string
  sub_key: string
  expiration: string
}

export const apiStorage = {
  wbi: useWebExtensionStorage<Wbi>('wbi', {
    img_key: '',
    sub_key: '',
    expiration: '',
  }),
}
