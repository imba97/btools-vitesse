// background 端日志转发器
// 包装 console.log/warn/error，把同样的内容 postMessage 给所有通过
// LOG_FORWARDER_PORT_NAME 连接的 content script。
// 顺带挂一个 ping handler 给 content script 做健康检查。

import {
  LOG_FORWARDER_PORT_NAME,
  PING_MESSAGE_TYPE,
  PONG_MESSAGE_TYPE
} from '~/utils/log-forwarder'

interface PortLike {
  postMessage: (msg: unknown) => void
  onDisconnect: { addListener: (cb: () => void) => void }
}

const ports = new Set<PortLike>()

function serialize(arg: unknown): unknown {
  if (arg instanceof Error)
    return { __error: true, name: arg.name, message: arg.message, stack: arg.stack }
  if (typeof arg === 'bigint')
    return { __bigint: arg.toString() }
  return arg
}

function broadcast(level: 'log' | 'warn' | 'error', args: unknown[]): void {
  const payload = { __btools_log: true, level, args: args.map(serialize) }
  for (const port of Array.from(ports)) {
    try {
      port.postMessage(payload)
    }
    catch {
      ports.delete(port)
    }
  }
}

export function registerLogForwarder(): void {
  // content script 连进来就收集，断了就剔除
  const api = (browser as any)?.runtime
  if (!api?.onConnect?.addListener)
    return

  api.onConnect.addListener((port: PortLike & { name: string }) => {
    if (port.name !== LOG_FORWARDER_PORT_NAME)
      return
    ports.add(port)
    port.onDisconnect.addListener(() => ports.delete(port))
  })

  // 包装 console（只包一次，重复 register 不会重复包）
  const c = console as unknown as {
    log: (...a: unknown[]) => void
    warn: (...a: unknown[]) => void
    error: (...a: unknown[]) => void
    __btoolsWrapped?: boolean
  }
  if (c.__btoolsWrapped)
    return
  const origLog = c.log.bind(console)
  const origWarn = c.warn.bind(console)
  const origError = c.error.bind(console)
  c.log = (...args: unknown[]) => {
    origLog(...args)
    broadcast('log', args)
  }
  c.warn = (...args: unknown[]) => {
    origWarn(...args)
    broadcast('warn', args)
  }
  c.error = (...args: unknown[]) => {
    origError(...args)
    broadcast('error', args)
  }
  c.__btoolsWrapped = true
}

// ping handler：content script 可以发 {type: 'btools:ping'} 给 background 验证 worker 活着
export function registerPingHandler(): void {
  const api = (browser as any)?.runtime
  if (!api?.onMessage?.addListener)
    return
  api.onMessage.addListener((message: unknown, _sender: unknown, sendResponse: (resp: unknown) => void) => {
    if (!message || typeof message !== 'object')
      return false
    if ((message as { type?: string }).type !== PING_MESSAGE_TYPE)
      return false
    sendResponse({ type: PONG_MESSAGE_TYPE, at: Date.now() })
    return false
  })
}
