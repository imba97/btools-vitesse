<template>
  <div max-h-100 of-y-auto>
    <AntList>
      <AntListItem px-2="!">
        <div w-full flex items-center justify-between>
          <div text="4">
            切换账号前确认
          </div>
          <AntSwitch v-model:checked="accountChangeConfirm" />
        </div>
      </AntListItem>
      <AntListItem px-2="!">
        <div w-full flex flex-col gap-2>
          <div w-full flex items-center justify-between gap-2>
            <div text="4">
              点击搜索失效视频
            </div>
            <AntSelect
              v-model:value="clickSearchInvalid"
              :options="searchOptions"
              style="width: 160px"
            />
          </div>
          <AntInput
            v-if="clickSearchInvalid === ClickSearchInvalid.Custom"
            v-model:value="clickSearchInvalidTemplate"
            placeholder="https://example.com/search?q={title}"
          />
          <div v-if="clickSearchInvalid !== ClickSearchInvalid.Off" text="3 gray-5">
            提示：用 <code>{title}</code> 作为标题占位符（仅 Custom 选项生效）
          </div>
          <div v-else text="3 gray-5">
            默认关闭——点失效视频卡片仍走 B 站默认行为，需要时切换到 Google / 百度 / Bing / 自定义
          </div>
        </div>
      </AntListItem>
    </AntList>
  </div>
</template>

<script lang="ts" setup>
import { ClickSearchInvalid } from '~/enums/popup'
import { configStorage } from '~/storages/config'
import { favoritesRecoveryStorage } from '~/storages/favorites-recovery'
import { withComputed } from '~/utils/storage'

const accountChangeConfirm = withComputed(configStorage.accountChangeConfirm)
const clickSearchInvalid = withComputed(favoritesRecoveryStorage.clickSearchInvalid)
const clickSearchInvalidTemplate = withComputed(favoritesRecoveryStorage.clickSearchInvalidTemplate)

// 顺序：关闭 → 三大搜索引擎 → 自定义
const searchOptions = [
  { value: ClickSearchInvalid.Off, label: '关闭' },
  { value: ClickSearchInvalid.Google, label: 'Google' },
  { value: ClickSearchInvalid.Baidu, label: '百度' },
  { value: ClickSearchInvalid.Bing, label: 'Bing' },
  { value: ClickSearchInvalid.Custom, label: '自定义' }
]
</script>
