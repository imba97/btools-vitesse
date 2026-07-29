import { createStorageRepository } from './repository'

export interface Wbi {
  img_key: string
  sub_key: string
  expiration: string
}

export const apiStorage = {
  wbi: createStorageRepository<Wbi>('api.wbi', {
    img_key: '',
    sub_key: '',
    expiration: ''
  })
}
