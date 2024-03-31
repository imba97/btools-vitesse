<script lang="ts" setup>
import { configStorage } from '~/storages/config'
import { withComputed } from '~/utils/storage'

const accountChangeConfirm = withComputed(configStorage.accountChangeConfirm)
</script>

<template>
  <n-scrollbar max-h-100>
    <n-list>
      <n-list-item>
        <div flex justify-between items-center px-2>
          <div text="4">
            切换账号前确认
          </div>
          <n-switch v-model:value="accountChangeConfirm" />
        </div>
      </n-list-item>
    </n-list>
  </n-scrollbar>
</template>

<style lang="scss" scoped>
</style>
