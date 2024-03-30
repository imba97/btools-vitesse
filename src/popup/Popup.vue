<script setup lang="ts">
import MultipleAccounts from './views/MultipleAccounts.vue'
import { getCurrentAccount } from '~/utils/account'

onMounted(() => {
  getCurrentAccount()
})
</script>

<template>
  <n-dialog-provider>
    <div w-100 min-h-100 p-5>
      <n-tabs type="line" animated>
        <n-tab-pane name="multiple-accounts" tab="多帐号">
          <MultipleAccounts />
        </n-tab-pane>
        <n-tab-pane name="test" tab="测试">
          测试
        </n-tab-pane>
      </n-tabs>
    </div>
  </n-dialog-provider>
</template>

<style lang="scss" scoped>
</style>
