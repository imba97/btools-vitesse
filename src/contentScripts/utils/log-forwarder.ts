// content script 端日志接收器
// 启动时连接 background 一个 port，把 background 通过 broadcast 发来的日志
// 写到页面 console（带 [btools:bg:log|warn|error] 前缀），这样在页面 DevTools
// 里就能看到 background 的 console 输出。
//
// background 没起来 / port 断了 → 1 秒后重连。

import {
  LOG_FORWARDER_PORT_NAME,
  PING_MESSAGE_TYPE,
  PONG_MESSAGE_TYPE
} from '~/utils/log-forwarder'

let connected = false

export function startLogForwarder(): () => void {
  const api = (browser as any)?.runtime
  if (!api?.connect)
    return () => {}

  let port: { onMessage: { addListener: (cb: (msg: unknown) => void) => void }, onDisconnect: { addListener: (cb: () => void) => void }, disconnect: () => void } | undefined
  let stopped = false
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined

  function connect(): void {
    if (stopped)
      return
    try {
      port = api.connect({ name: LOG_FORWARDER_PORT_NAME }) as typeof port
      connected = true
      port!.onDisconnect.addListener(() => {
        connected = false
        port = undefined
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 1000)
        }
      })
    }
    catch {
      connected = false
      if (!stopped)
        reconnectTimer = setTimeout(connect, 1000)
    }
  }
  connect()

  return () => {
    stopped = true
    if (reconnectTimer !== undefined)
      clearTimeout(reconnectTimer)
    port?.disconnect()
  }
}

/**
 * 给 background 发 ping，timeout 内收到 pong 说明 worker 活着。
 * 用来诊断"background 是否在跑" / "onMessage 监听器是否注册"。
 */
export async function pingBackground(timeoutMs = 1500): Promise<{ alive: boolean, latencyMs?: number, error?: string }> {
  const api = (browser as any)?.runtime
  if (!api?.sendMessage)
    return { alive: false, error: 'browser.runtime.sendMessage not available' }
  const start = Date.now()
  try {
    const resp = await Promise.race([
      api.sendMessage({ type: PING_MESSAGE_TYPE, at: start }) as Promise<{ type: string, at: number }>,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ])
    if (resp && resp.type === PONG_MESSAGE_TYPE)
      return { alive: true, latencyMs: Date.now() - start }
    return { alive: false, error: `unexpected response: ${JSON.stringify(resp)}` }
  }
  catch (err) {
    return { alive: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function isLogForwarderConnected(): boolean {
  return connected
}
