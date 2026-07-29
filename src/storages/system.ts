import { PopupNavbarType } from '~/enums/popup'
import { createStorageRepository } from './repository'

export const systemStorage = {
  popupCurrentNavbar: createStorageRepository<PopupNavbarType>('system.popupCurrentNavbar', PopupNavbarType.MultipleAccounts)
}
