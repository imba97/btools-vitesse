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

/* Btools bar 挂在 body 下，不能作为 B 站 Vue 工具栏的 sibling。
   为原工具栏预留等高空间，使绝对定位的 bar 不会遮住页面控件。 */
#arc_toolbar_report {
  margin-top: 32px !important;
}

.btools-toolbar-host {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 32px;
  padding: 4px 12px;
  color: canvastext;
  font-size: 16px;
  line-height: 1;
  user-select: none;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
}

.btools-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  gap: 4px;
  padding: 8px 0;
  box-sizing: border-box;
}

.btools-toolbar__items {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 320px;
  overflow: hidden;
  opacity: 1;
  transition: max-width 150ms ease, opacity 150ms ease;
}

.btools-toolbar__items.is-collapsed {
  max-width: 0;
  opacity: 0;
  pointer-events: none;
}

.btools-toolbar__btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: inherit;
  text-decoration: none;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.75;
  transition: background-color 150ms ease, opacity 150ms ease;
}

.btools-toolbar__btn:hover {
  background: rgba(128, 128, 128, 0.16);
  opacity: 1;
}

.btools-toolbar__toggle {
  background: rgba(128, 128, 128, 0.08);
}

.btools-toolbar__btn.opacity-35 { opacity: 0.35; pointer-events: none; }
.btools-toolbar__btn.cursor-progress { cursor: progress; }
.btools-toolbar__btn.cursor-not-allowed { cursor: not-allowed; }
.btools-toolbar__btn.cursor-pointer { cursor: pointer; }
.btools-toolbar__icon,
.btools-toolbar__spinner { display: inline-block; width: 1em; height: 1em; }
.btools-toolbar__icon--image {
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M8.5 13.5 11 16.5l3.5-4.5L19 18H5l3.5-4.5M8 8.5A1.5 1.5 0 1 1 8 11a1.5 1.5 0 0 1 0-3z'/%3E%3C/svg%3E") center / contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M8.5 13.5 11 16.5l3.5-4.5L19 18H5l3.5-4.5M8 8.5A1.5 1.5 0 1 1 8 11a1.5 1.5 0 0 1 0-3z'/%3E%3C/svg%3E") center / contain no-repeat;
  background-color: currentColor;
}
.btools-toolbar__icon--chevron-left,
.btools-toolbar__icon--chevron-right {
  border: solid currentColor;
  border-width: 0 2px 2px 0;
  box-sizing: border-box;
  transform: rotate(135deg);
  width: 8px;
  height: 8px;
}
.btools-toolbar__icon--chevron-right { transform: rotate(-45deg); }
.btools-toolbar__spinner {
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btools-spin 700ms linear infinite;
}

@keyframes btools-spin { to { transform: rotate(360deg); } }

@media (prefers-color-scheme: dark) {
  .btools-toolbar-host {
    background: rgba(31, 32, 35, 0.92);
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
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
