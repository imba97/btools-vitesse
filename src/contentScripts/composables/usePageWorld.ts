import type { BusRequestOptions } from '../utils/bus-client'
import type { GetWindowData, WindowDataKey } from '~/bridge/page-world'
import { requestBus } from '../utils/bus-client'

export function usePageWorld() {
  async function getWindow(key: WindowDataKey, options: BusRequestOptions = {}): Promise<GetWindowData> {
    return await requestBus('get-window', { key, frame: 'top' }, options)
  }

  return {
    getWindow
  }
}
