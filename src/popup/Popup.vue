<script setup lang="ts">
import moment from 'moment'
import { multipleAccountsStorage } from '~/storages/multipleAccounts'

import type { Account } from '~/storages/multipleAccounts'

const accountsList = computed(() => multipleAccountsStorage.accounts.value)

const isCurrentAccount = (account: Account) => {
  return account.DedeUserID === multipleAccountsStorage.currentAccount.value
}

const changeAccount = async (account: Account) => {
  const cookies = await browser.cookies
    .getAll({
      domain: '.bilibili.com',
    })

  _.forEach(['SESSDATA', 'bili_jct'], (key) => {
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

    switch (key) {
      case 'SESSDATA':
        cookie.value = account.SESSDATA
        break
      case 'bili_jct':
        cookie.value = account.bili_jct
        break
    }

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
</script>

<template>
  <div w-100 min-h-100 p-5>
    <div grid="~ cols-2" items-center gap-3>
      <div
        v-for="account in accountsList" :key="account.DedeUserID" class="account-item" :class="{
          actived: isCurrentAccount(account),
        }" flex="~ col" items-center b="~ solid" rounded-5
      >
        <div>
          <img :src="account.face" h-32 w-32 rounded-5>
        </div>

        <div text="5 primary">
          {{ account.name }}
        </div>

        <div>
          <button :disabled="isCurrentAccount(account)" @click="changeAccount(account)">
            切换
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.account-item {
  --at-apply: b-gray;

  &.actived {
    --at-apply: b-primary;
  }
}
</style>
