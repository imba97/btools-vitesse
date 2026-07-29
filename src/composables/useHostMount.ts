import type { ShallowRef } from 'vue'
import { onUnmounted, shallowRef } from 'vue'

export interface UseHostMountReturn {
  /**
   * 当前已挂载的 host 元素（响应式，可直接传给 `<Teleport :to="hostEl">`）
   *
   * null 时表示 host 尚未挂载或已被外部代码移除。
   */
  hostEl: Readonly<ShallowRef<HTMLElement | null>>
  /**
   * 把 host 挂到 document.body，并定位在 `toolbarSelector` 命中的元素上方。
   *
   * - 目标存在 → 复用或创建 host 并同步位置，返回 true
   * - `toolbarSelector` 未命中 → 返回 false（调用方自行重试）
   * - 插入抛错（极少）→ 返回 false
   *
   * 幂等：可以反复调用，MO 兜底每次都跑一次也不会出错。
   */
  mount: () => boolean
  /** 立刻把 host 从 DOM 移除（清 ref） */
  unmount: () => void
}

/**
 * 在 document.body 里挂载一个我们控制的 host 元素（典型场景：扩展 bar 插入宿主页面）
 *
 * 防御策略：**不** monkey-patch `Node.prototype`。isolated world 的 patch 对宿主
 * 页面的 MAIN world 代码不可见，且会拦自家 `host.remove()` 导致 DOM 残留。
 *
 * host 不能作为宿主页面 Vue 管理节点的 sibling。Vue 2 在重渲染时会按 vnode
 * 子节点索引复用节点，外来 sibling 会被当作自己的 vnode patch，进而导致
 * `setAttribute is not a function` 或 `HierarchyRequestError`。因此 host 始终是
 * body 的直接子节点，仅按目标工具栏的矩形定位。
 *
 * 使用示例：
 * ```ts
 * const toolbar = useHostMount('#arc_toolbar_report', {
 *   id: 'btools-bar-host',
 *   className: 'flex h-8 ...'
 * })
 *
 * // MO 兜底
 * const mo = new MutationObserver(() => toolbar.mount())
 * mo.observe(document.body, { childList: true, subtree: true })
 * onUnmounted(() => mo.disconnect())
 * ```
 */
export function useHostMount(
  toolbarSelector: string,
  options: { id?: string, className?: string }
): UseHostMountReturn {
  const hostEl = shallowRef<HTMLElement | null>(null)

  function createHost(): HTMLElement {
    const host = document.createElement('div')
    if (options.id)
      host.id = options.id
    if (options.className)
      host.className = options.className
    return host
  }

  function positionHost(host: HTMLElement, toolbar: HTMLElement): void {
    const rect = toolbar.getBoundingClientRect()
    host.style.position = 'absolute'
    host.style.top = `${rect.top + window.scrollY}px`
    host.style.left = `${rect.left + window.scrollX}px`
    host.style.width = `${rect.width}px`
    host.style.transform = 'translateY(-100%)'
    host.style.zIndex = '10'
  }

  function mount(): boolean {
    const toolbar = document.querySelector<HTMLElement>(toolbarSelector)
    if (!toolbar)
      return false

    if (hostEl.value?.parentElement === document.body) {
      positionHost(hostEl.value, toolbar)
      return true
    }

    if (hostEl.value?.parentElement) {
      hostEl.value.remove()
    }

    const host = createHost()
    try {
      document.body.appendChild(host)
      positionHost(host, toolbar)
    }
    catch {
      // 失败留给下一帧 MO 兜底重试
      return false
    }
    hostEl.value = host
    return true
  }

  function unmount(): void {
    if (hostEl.value?.parentElement) {
      hostEl.value.remove()
    }
    hostEl.value = null
  }

  // 组件卸载时强制清掉，避免 HMR / SPA 切换留下孤儿 host
  onUnmounted(() => {
    unmount()
  })

  return { hostEl, mount, unmount }
}
