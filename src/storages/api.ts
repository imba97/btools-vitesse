import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

interface Wbi {
  img_key: string
  sub_key: string
  expiration: string
}

const { useStorage } = useWebExtensionStorage('api')

export const apiStorage = {
  wbi: useStorage<Wbi>('wbi', {
    img_key: '',
    sub_key: '',
    expiration: ''
  })
}
