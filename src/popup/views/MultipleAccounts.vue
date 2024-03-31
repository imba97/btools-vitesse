<script lang="ts" setup>
import { multipleAccountsStorage } from '~/storages/multipleAccounts'

import type { Account } from '~/storages/multipleAccounts'

const dialog = useDialog()

const accountsList = computed(() => multipleAccountsStorage.accounts.value)

const isCurrentAccount = (account: Account) => {
  return account.DedeUserID === multipleAccountsStorage.currentAccount.value
}

const changeAccount = async (account: Account) => {
  const cookies = await browser.cookies
    .getAll({
      domain: '.bilibili.com',
    })

  _.forEach(['SESSDATA', 'bili_jct', 'DedeUserID', 'DedeUserID__ckMd5'], (key: keyof Account) => {
    let cookie: any = _.find(cookies, { name: key })

    if (!cookie) {
      cookie = {
        url: 'https://bilibili.com',
        domain: '.bilibili.com',
        expirationDate: moment().add(180, 'days').valueOf() / 1000,
        httpOnly: key === 'SESSDATA',
        name: key,
        path: '/',
        sameSite: 'unspecified',
        secure: false,
        storeId: '0',
        value: '',
      }
    }

    cookie.value = account[key]

    browser.cookies.set({
      url: 'https://bilibili.com',
      domain: cookie.domain,
      expirationDate: cookie.expirationDate,
      httpOnly: cookie.httpOnly,
      name: cookie.name,
      path: cookie.path,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      storeId: cookie.storeId,
      value: cookie.value,
    })

    multipleAccountsStorage.currentAccount.value = account.DedeUserID
  })
}

const removeAccount = (account: Account) => {
  dialog.warning({
    title: '删除确认',
    content: `确认删除 ${account.name}？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      _.remove(multipleAccountsStorage.accounts.value, {
        DedeUserID: account.DedeUserID,
      })
    },
  })
}
</script>

<template>
  <n-scrollbar max-h-100>
    <div
      flex="~ col" gap-3 :class="{
        'mr-6': accountsList.length >= 5,
      }"
    >
      <div
        v-for="account in accountsList" :key="account.DedeUserID" class="account-item" :class="{
          actived: isCurrentAccount(account),
        }" flex justify-between items-center b="~ solid" rounded-5 p-3
      >
        <div flex items-center gap-3>
          <div>
            <img :src="account.face" h-16 w-16 rounded-5>
          </div>

          <div class="name" text-5>
            {{ account.name }}
          </div>
        </div>

        <div mt-3 flex gap-2>
          <n-button type="success" :disabled="isCurrentAccount(account)" @click="changeAccount(account)">
            切换
          </n-button>

          <n-button type="error" ghost @click="removeAccount(account)">
            删除
          </n-button>
        </div>
      </div>
    </div>
  </n-scrollbar>
</template>

<style lang="scss" scoped>
.account-item {
  --at-apply: b-gray;

  &.actived {
    --at-apply: b-primary;

    .name {
      --at-apply: text-primary;
    }
  }
}
</style>
