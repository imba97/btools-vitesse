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
   * 把 host 插入 `toolbarSelector` 命中的元素的**前一个 sibling** 位置。
   *
   * - 位置正确 → 复用现有 host，返回 true
   * - `toolbarSelector` 未命中 / 无父容器 → 返回 false（调用方自行重试）
   * - 插入抛错（极少）→ 返回 false
   *
   * 幂等：可以反复调用，MO 兜底每次都跑一次也不会出错。
   */
  mount: () => boolean
  /** 立刻把 host 从 DOM 移除（清 ref） */
  unmount: () => void
}

/**
 * 在外部页面 DOM 里挂载一个我们控制的 host 元素（典型场景：扩展 bar 插入宿主页面）
 *
 * 防御策略：**不** monkey-patch `Node.prototype`。isolated world 的 patch 对宿主
 * 页面的 MAIN world 代码不可见，且会拦自家 `host.remove()` 导致 DOM 残留。
 *
 * 真正的防御是"被移除就重建"：把 `mount()` 包进 MutationObserver 里调用，
 * 外部代码（Vue patch / jQuery / 业务 re-render）把 host 拔掉时，下一帧 MO
 * 检测到 `hostEl.value.parentElement === null` 或位置不对，再次 `mount()`。
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

  function mount(): boolean {
    const toolbar = document.querySelector<HTMLElement>(toolbarSelector)
    if (!toolbar?.parentElement)
      return false

    // 位置正确 → 复用
    if (
      hostEl.value
      && hostEl.value.parentElement === toolbar.parentElement
      && hostEl.value.nextElementSibling === toolbar
    ) {
      return true
    }

    if (hostEl.value?.parentElement) {
      hostEl.value.remove()
    }

    const host = createHost()
    try {
      toolbar.parentElement.insertBefore(host, toolbar)
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
