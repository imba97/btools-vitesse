// 收藏夹失效视频恢复的本地缓存 + 相关设置
//
// 数据形状：{ [bvid]: CachedVideo }
// - 成功条目：{ bvid, data, cachedAt } —— data 来自 biliplus 的解析结果（统一成 VideoViewData）
// - 失败条目：{ bvid, notFound: true, cachedAt } —— biliplus 返回错误/无数据，避免每次扫到都重试
// - cachedAt: Date.now() 时间戳，过期清理时用来算 TTL
import type { VideoViewData } from '~/api/data/bilibili.data'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import { ClickSearchInvalid } from '~/enums/popup'

export interface CachedVideo {
  bvid: string
  /** 成功恢复的视频信息（成功条目有，失败条目无） */
  data?: VideoViewData
  /** 已请求过但 biliplus 返回错误/无数据 —— 标记，避免短时间内反复重试 */
  notFound?: boolean
  cachedAt: number
}

export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 天（成功条目）
export const NOT_FOUND_CACHE_TTL_MS = 10 * 24 * 60 * 60 * 1000 // 10 天（失败条目 —— 失效视频可能后续重新上架，短 TTL 让它有机会被重新发现）

const { useStorage } = useWebExtensionStorage('favorites-recovery')

// 自定义模板默认值：B 站站内搜索（与内置选项行为对齐：同一规则 {title} 占位）
export const DEFAULT_CUSTOM_SEARCH_TEMPLATE = 'https://search.bilibili.com/all?keyword={title}'

export const favoritesRecoveryStorage = {
  cache: useStorage<Record<string, CachedVideo>>('cache', {}),

  // 点击已恢复的失效视频卡片时，跳转到哪个搜索引擎搜标题
  // 默认 Off——不拦截点击，需要用户主动在 popup 配置里启用
  clickSearchInvalid: useStorage<ClickSearchInvalid>(
    'clickSearchInvalid',
    ClickSearchInvalid.Off
  ),
  // 用户自定义模板（仅在 clickSearchInvalid === Custom 时生效）
  clickSearchInvalidTemplate: useStorage<string>(
    'clickSearchInvalidTemplate',
    DEFAULT_CUSTOM_SEARCH_TEMPLATE
  )
}
