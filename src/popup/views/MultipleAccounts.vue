<style lang="scss" scoped>
.account-item {
  --uno: b-gray;

  &.actived {
    --uno: b-primary bg-primary-100;

    .name {
      --uno: text-primary;
    }
  }
}
</style>

<template>
  <div max-h-100 of-y-auto>
    <div
      flex="~ col" gap-3 :class="{
        'mr-6': accountsList.length >= 5
      }"
    >
      <div
        v-for="account in accountsList" :key="account.DedeUserID" class="account-item" :class="{
          actived: isCurrentAccount(account)
        }" b="~ solid" flex items-center justify-between gap-3 rounded-2 px-3 py-1
      >
        <div flex="~ 1" items-center gap-3>
          <img :src="account.face" h-10 w-10 rounded-2>

          <div class="name" max-w-46 text-truncate text-5>
            {{ account.name }}
          </div>
        </div>

        <div flex gap-2>
          <AntButton type="primary" :disabled="isSwitching || isCurrentAccount(account)" @click="changeAccount(account)">
            切换
          </AntButton>

          <AntDropdown trigger="click">
            <AntButton secondary :disabled="isSwitching" @click="selectedAccount = account">
              更多
            </AntButton>

            <template #overlay>
              <AntMenu>
                <AntMenuItem :disabled="isSwitching || !isCurrentAccount(account)" @click="leaveAccount">
                  暂离
                </AntMenuItem>

                <AntMenuItem :disabled="isSwitching" @click="removeAccount">
                  <span size-full text-red-6>
                    删除
                  </span>
                </AntMenuItem>
              </AntMenu>
            </template>
          </AntDropdown>
        </div>
      </div>
    </div>

    <ContextHolder />
  </div>
</template>

<script lang="ts" setup>
import type { Account } from '~/storages/multipleAccounts'
import { configStorage } from '~/storages/config'
import { multipleAccountsStorage } from '~/storages/multipleAccounts'
import { createAccountCookieSwitcher, setBilibiliAccountCookies } from '../utils/accountCookies'

const [modal, ContextHolder] = Modal.useModal()

const selectedAccount = ref<Account | null>(null)
const isSwitching = ref(false)

const accountsList = computed(() => multipleAccountsStorage.accounts.value)

function isCurrentAccount(account: Account) {
  return account.DedeUserID === multipleAccountsStorage.currentAccount.value
}

const accountCookieSwitcher = createAccountCookieSwitcher({
  writeCookies: setBilibiliAccountCookies,
  setCurrentAccount: DedeUserID => (multipleAccountsStorage.currentAccount.value = DedeUserID),
  onSwitchingChange: value => (isSwitching.value = value)
})

async function changeAccount(account: Account) {
  if (isSwitching.value)
    return

  if (configStorage.accountChangeConfirm.value) {
    await promisifyModal(
      modal.confirm({
        title: '切换确认',
        content: `确认切换到账号 ${account.name}？`
      })
    )
  }

  await accountCookieSwitcher.changeAccount(account)
}

async function removeAccount() {
  if (isSwitching.value)
    return

  if (!selectedAccount.value) {
    return
  }

  await promisifyModal(
    modal.confirm({
      title: '删除确认',
      content: `确认删除 ${selectedAccount.value.name}？`,
      type: 'warning'
    })
  )

  _remove(multipleAccountsStorage.accounts.value, {
    DedeUserID: selectedAccount.value.DedeUserID
  })
}

// 暂离
async function leaveAccount() {
  if (isSwitching.value)
    return

  await accountCookieSwitcher.leaveAccount()
}
</script>
