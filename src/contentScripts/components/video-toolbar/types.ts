/**
 * 播放页功能按钮 bar 的按钮定义
 *
 * 以后加新功能按钮：在 video-toolbar.vue 的 buttons computed 里 push 一项即可，
 * 有外链走 href（浏览器原生新标签打开，不会被弹窗拦截），纯动作走 onClick。
 */
export interface ToolbarButton {
  key: string
  /** UnoCSS 图标 class，如 i-mdi-image-outline —— 按钮只放图标不放文字 */
  icon: string
  /** 悬浮说明（无文字按钮靠它表意，也是无障碍 label） */
  title: string
  /** 有值则渲染成 <a target="_blank">；null/undefined 且有 onClick 则渲染成 <button> */
  href?: string | null
  loading?: boolean
  disabled?: boolean
  onClick?: (event: MouseEvent) => void
}
