import type { WritableComputedRef } from 'vue'
import { panelStorage } from '~/storages/panel'

export interface UsePanelCollapseReturn {
  /** 是否收起，可读可写（写入即持久化到 storage.local） */
  collapsed: WritableComputedRef<boolean>
  toggle: () => void
}

/**
 * 面板收起/展开状态（持久化，当成一个设置项）
 *
 * 任何需要「收起/展开且记住选择」的 UI 都可以复用：
 * ```ts
 * const { collapsed, toggle } = usePanelCollapse('video-toolbar')
 * ```
 *
 * 默认 collapsed = true，这同时兜住了 storage 异步读取的空窗期：
 * 初次渲染就是收起态，读到用户之前的选择再展开，不会出现「先展开再收起」的闪动。
 *
 * @param key 面板标识，storage 里以 `panel.collapsed[key]` 保存
 * @param defaultCollapsed 用户从没操作过时的默认值
 */
export function usePanelCollapse(key: string, defaultCollapsed = true): UsePanelCollapseReturn {
  const collapsed = computed<boolean>({
    get() {
      const map = panelStorage.collapsed.value
      return key in map ? map[key] : defaultCollapsed
    },
    set(value) {
      // 整体替换而不是原地改 —— useWebExtensionStorage 的 watch 虽然是 deep，
      // 但换新对象语义更清晰，也避免序列化时读到中间态
      panelStorage.collapsed.value = {
        ...panelStorage.collapsed.value,
        [key]: value
      }
    }
  })

  return {
    collapsed,
    toggle: () => {
      collapsed.value = !collapsed.value
    }
  }
}
