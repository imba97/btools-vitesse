import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

import { PopupNavbarType } from '~/enums/popup'

const { useStorage } = useWebExtensionStorage('system')

export const systemStorage = {
  popupCurrentNavbar: useStorage<PopupNavbarType>('popupCurrentNavbar', PopupNavbarType.MultipleAccounts)
}
