// 注入页面级 CSS 覆盖（page DOM，不在 Shadow DOM 里）
//
// B 站原站对「/『/【 开头的卡片标题加了 text-indent: -.6em，
// 视觉效果是第一个括号字符从卡片左边凸出去——比较丑，直接覆盖掉。
//
// 恢复 loading 浮层：在 biliplus 请求期间覆盖在卡片封面上，居中显示旋转 spinner。
// 这里硬编码 UnoCSS 的 i-eos-icons-loading（animate-spin 由 SVG 内部的
// <animateTransform> 提供，不需要额外的 CSS @keyframes —— 重复加动画会导致双倍速度）。
//
// 只注入一次，重复调用幂等。

const STYLE_ID = 'btools-page-style-overrides'

// UnoCSS 编译产物：i-eos-icons-loading + animate-spin
// 注意：动画来自 SVG 内部的 <animateTransform>，UnoCSS 的 animate-spin 在这里其实是冗余的。
// mask 只负责让 SVG 形状以 background-color 颜色显示（currentColor 即色）。
const SPINNER_SVG = `url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1.2em' height='1.2em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z' opacity='.5'/%3E%3Cpath fill='currentColor' d='M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z'%3E%3CanimateTransform attributeName='transform' dur='1s' from='0 12 12' repeatCount='indefinite' to='360 12 12' type='rotate'/%3E%3C/path%3E%3C/svg%3E")`

const CSS_TEXT = `
/* B 站原站对「/『/【 开头的标题加 text-indent: -.6em，
   会让第一个字符从左侧凸出去——覆盖 */
.bili-video-card__title[title^="「"],
.bili-video-card__title[title^="『"],
.bili-video-card__title[title^="【"] {
  text-indent: 0 !important;
}

/* 恢复 loading 浮层（覆盖在卡片封面上） */
.btools-loading-overlay {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background-color: rgba(0, 0, 0, 0.45) !important;
  z-index: 9999 !important;
  pointer-events: none;
  border-radius: inherit;
}

/* 同步 UnoCSS 编译产物（page DOM 用，Shadow DOM 内用 UnoCSS 原生 class）
   注意：动画来自 SVG 内部的 <animateTransform>，不要在 CSS 里再加 @keyframes 旋转 */
.btools-loading-spinner {
  --un-icon: ${SPINNER_SVG};
  -webkit-mask: var(--un-icon) no-repeat;
          mask: var(--un-icon) no-repeat;
  -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
  background-color: currentColor !important;
  display: inline-block !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px;
  min-height: 32px;
  color: white !important;
  vertical-align: text-bottom;
}
`

export function injectPageStyles(): void {
  if (document.getElementById(STYLE_ID))
    return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS_TEXT
  document.head.appendChild(el)
}
