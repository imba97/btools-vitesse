<template>
  <AConfigProvider :locale="zhCN" :theme="theme">
    <div min-h-72 w-128 px-3 pb-3>
      <ATabs v-model:value="currentNavbarType" type="line" animated>
        <ATabPane :key="PopupNavbarType.MultipleAccounts" tab="多帐号">
          <MultipleAccounts />
        </ATabPane>
        <ATabPane :key="PopupNavbarType.Config" tab="设置">
          <Config />
        </ATabPane>
      </ATabs>
    </div>
  </AConfigProvider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'

import { PopupNavbarType } from '~/enums/popup'
import { systemStorage } from '~/storages/system'
import { getCurrentAccount } from '~/utils/account'
import { withComputed } from '~/utils/storage'
import Config from './views/Config.vue'

import MultipleAccounts from './views/MultipleAccounts.vue'

const theme = {
  token: {
    colorPrimary: '#18a058'
  }
}

const currentNavbarType = withComputed(systemStorage.popupCurrentNavbar)

onMounted(() => {
  getCurrentAccount()
})
</script>
