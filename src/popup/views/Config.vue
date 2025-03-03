<template>
  <div max-h-100 of-y-auto>
    <AList>
      <AListItem px-2="!">
        <div w-full flex items-center justify-between>
          <div text="4">
            切换账号前确认
          </div>
          <ASwitch v-model:checked="accountChangeConfirm" />
        </div>
      </AListItem>
    </AList>
  </div>
</template>

<script lang="ts" setup>
import { configStorage } from '~/storages/config'
import { withComputed } from '~/utils/storage'

const accountChangeConfirm = withComputed(configStorage.accountChangeConfirm)
</script>
