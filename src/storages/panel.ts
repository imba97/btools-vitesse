import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

const { useStorage } = useWebExtensionStorage('panel')

export const panelStorage = {
  /**
   * 各面板的收起状态，key 由调用方（usePanelCollapse）自己定义
   *
   * 用一个 Record 而不是每个面板一个 key —— 面板会越来越多，
   * 集中存一份避免 storage 里散落一堆 `panel.xxxCollapsed`
   */
  collapsed: useStorage<Record<string, boolean>>('collapsed', {})
}
