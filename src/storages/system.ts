import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

import { PopupNavbarType } from '~/enums/popup'

export const systemStorage = {
  popupCurrentNavbar: useWebExtensionStorage<PopupNavbarType>('popupCurrentNavbar', PopupNavbarType.MultipleAccounts)
}
