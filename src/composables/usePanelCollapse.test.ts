// 没有顶层 import（mock 需要在动态 import 之前生效），显式声明成模块避免全局作用域重名
export {}

const storageState: Record<string, string> = {}
const storageListeners: Array<(changes: Record<string, { newValue: string | null }>) => void> = []

vi.mock('webextension-polyfill', () => {
  return {
    storage: {
      local: {
        remove: vi.fn(async (key: string) => {
          delete storageState[key]
        }),
        set: vi.fn(async (value: Record<string, string>) => {
          Object.assign(storageState, value)
        }),
        get: vi.fn(async (key: string) => {
          return { [key]: storageState[key] }
        })
      },
      onChanged: {
        addListener: vi.fn((listener: (changes: Record<string, { newValue: string | null }>) => void) => {
          storageListeners.push(listener)
        }),
        removeListener: vi.fn((listener: (changes: Record<string, { newValue: string | null }>) => void) => {
          const index = storageListeners.indexOf(listener)
          if (index >= 0)
            storageListeners.splice(index, 1)
        })
      }
    }
  }
})

async function importComposable() {
  // 每个用例重新加载模块，避免 storages/panel 的单例 ref 在用例间串味
  vi.resetModules()
  const mod = await import('./usePanelCollapse')
  return mod.usePanelCollapse
}

describe('usePanelCollapse', () => {
  beforeEach(() => {
    Object.keys(storageState).forEach((key) => {
      delete storageState[key]
    })
    storageListeners.splice(0, storageListeners.length)
  })

  it('没有存过时用默认值（默认收起）', async () => {
    const usePanelCollapse = await importComposable()

    expect(usePanelCollapse('video-toolbar').collapsed.value).toBe(true)
    expect(usePanelCollapse('other-panel', false).collapsed.value).toBe(false)
  })

  it('toggle 后写入 storage', async () => {
    const usePanelCollapse = await importComposable()
    const { collapsed, toggle } = usePanelCollapse('video-toolbar')

    toggle()
    expect(collapsed.value).toBe(false)

    await vi.waitFor(() => {
      expect(JSON.parse(storageState['panel.collapsed'])).toEqual({ 'video-toolbar': false })
    })
  })

  it('读取已存在的状态', async () => {
    storageState['panel.collapsed'] = JSON.stringify({ 'video-toolbar': false })

    const usePanelCollapse = await importComposable()
    const { collapsed } = usePanelCollapse('video-toolbar')

    await vi.waitFor(() => {
      expect(collapsed.value).toBe(false)
    })
  })

  it('不同 key 互不干扰', async () => {
    const usePanelCollapse = await importComposable()
    const first = usePanelCollapse('panel-a')
    const second = usePanelCollapse('panel-b')

    first.toggle()

    expect(first.collapsed.value).toBe(false)
    expect(second.collapsed.value).toBe(true)

    await vi.waitFor(() => {
      expect(JSON.parse(storageState['panel.collapsed'])).toEqual({ 'panel-a': false })
    })
  })
})
