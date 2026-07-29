import { BackgroundMessageType, sendBackgroundRequest } from '~/protocol/background'

export function extraFetch(url: string): Promise<string> {
  return sendBackgroundRequest<string>({
    type: BackgroundMessageType.fetchText,
    url
  })
}
