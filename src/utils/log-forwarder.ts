// background ↔ content script 日志桥的常量
// 用法：
//   - background 注册后：自动把 console.log/warn/error 转发到所有连接的 content script
//   - content script 启动时连接 port，把 background 的日志输出到页面 console（带 [btools:bg] 前缀）

export const LOG_FORWARDER_PORT_NAME = 'btools:log-forwarder'
export const PING_MESSAGE_TYPE = 'btools:ping'
export const PONG_MESSAGE_TYPE = 'btools:pong'
