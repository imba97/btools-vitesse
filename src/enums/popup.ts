export enum PopupNavbarType {
  MultipleAccounts = 'multiple-accounts',
  Config = 'config'
}

// 收藏夹失效视频卡片点击后的搜索行为
export enum ClickSearchInvalid {
  Off = 'off',
  Google = 'google',
  Baidu = 'baidu',
  Bing = 'bing',
  Custom = 'custom'
}

// 各内置选项对应的搜索 URL 模板，{title} 会被替换为真实标题
// 同一规则也适用于用户自定义模板——逻辑统一封装在 buildSearchUrl
const SEARCH_URL_TEMPLATES: Record<ClickSearchInvalid, string> = {
  [ClickSearchInvalid.Off]: '',
  [ClickSearchInvalid.Google]: 'https://www.google.com/search?q={title}',
  [ClickSearchInvalid.Baidu]: 'https://www.baidu.com/s?wd={title}',
  [ClickSearchInvalid.Bing]: 'https://www.bing.com/search?q={title}',
  [ClickSearchInvalid.Custom]: ''
}

/**
 * 根据用户选项构造实际搜索 URL（统一封装：内置 / 自定义走同一条 replace 路径）
 *
 * - Off：返回 null（不拦截点击默认行为）—— 默认值，避免用户被强行引导到搜索引擎
 * - Custom：使用 userCustomTemplate；为空/纯空白返回 null
 * - 其他内置选项：使用对应模板
 *
 * 所有模板都用 `{title}` 占位，实际值用 `encodeURIComponent` 转义；
 * 同一模板里出现多个 `{title}` 也会被全部替换。
 */
export function buildSearchUrl(
  option: ClickSearchInvalid,
  title: string,
  userCustomTemplate?: string
): string | null {
  if (option === ClickSearchInvalid.Off)
    return null

  const template = option === ClickSearchInvalid.Custom
    ? (userCustomTemplate || '').trim()
    : SEARCH_URL_TEMPLATES[option]

  if (!template || !template.includes('{title}'))
    return null

  return template.replace(/\{title\}/g, encodeURIComponent(title))
}
