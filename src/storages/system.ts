import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

import { PopupNavbarType } from '~/enums/popup'

export const configStorage = {
  popupCurrentNavbar: useWebExtensionStorage<PopupNavbarType>('popupCurrentNavbar', PopupNavbarType.MultipleAccounts),
}
