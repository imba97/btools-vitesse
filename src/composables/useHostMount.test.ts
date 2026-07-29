import { afterEach, describe, expect, it } from 'vitest'
import { useHostMount } from './useHostMount'

describe('useHostMount', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('keeps the host out of the page toolbar parent', () => {
    document.body.innerHTML = `
      <div id="page-root">
        <div id="arc_toolbar_report"></div>
      </div>
    `
    const toolbar = document.querySelector<HTMLElement>('#arc_toolbar_report')!
    vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
      top: 120,
      left: 24,
      width: 960
    } as DOMRect)

    const { hostEl, mount } = useHostMount('#arc_toolbar_report', { id: 'btools-bar-host' })

    expect(mount()).toBe(true)
    expect(hostEl.value?.parentElement).toBe(document.body)
    expect(toolbar.parentElement?.children).toHaveLength(1)
    expect(hostEl.value?.style.position).toBe('absolute')
    expect(hostEl.value?.style.top).toBe('120px')
    expect(hostEl.value?.style.left).toBe('24px')
    expect(hostEl.value?.style.width).toBe('960px')
    expect(hostEl.value?.style.transform).toBe('translateY(-100%)')
  })
})
