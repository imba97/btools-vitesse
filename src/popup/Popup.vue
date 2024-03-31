<script setup lang="ts">
import MultipleAccounts from './views/MultipleAccounts.vue'
import Config from './views/Config.vue'

import { PopupNavbarType } from '~/enums/popup'

import { getCurrentAccount } from '~/utils/account'

onMounted(() => {
  getCurrentAccount()
})
</script>

<template>
  <n-dialog-provider>
    <div w-100 min-h-60 px-3 pb-3>
      <n-tabs type="line" animated>
        <n-tab-pane :name="PopupNavbarType.MultipleAccounts" tab="多帐号">
          <MultipleAccounts />
        </n-tab-pane>
        <n-tab-pane :name="PopupNavbarType.Config" tab="设置">
          <Config />
        </n-tab-pane>
      </n-tabs>
    </div>
  </n-dialog-provider>
</template>

<style lang="scss" scoped>
</style>
