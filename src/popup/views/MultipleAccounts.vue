<script lang="ts" setup>
import { NButton } from 'naive-ui'
import { multipleAccountsStorage } from '~/storages/multipleAccounts'
import { configStorage } from '~/storages/config'
import { withDialogPromise } from '~/utils/dialog'

import type { Account } from '~/storages/multipleAccounts'

let selectedAccount: Account | null = null

const dialog = useDialog()

const accountsList = computed(() => multipleAccountsStorage.accounts.value)

function isCurrentAccount(account: Account) {
  return account.DedeUserID === multipleAccountsStorage.currentAccount.value
}

async function setCookies(account?: Account) {
  const cookies = await browser.cookies
    .getAll({
      domain: '.bilibili.com',
    })

  _forEach(['SESSDATA', 'bili_jct', 'DedeUserID', 'DedeUserID__ckMd5'], (key: keyof Account) => {
    let cookie: any = _find(cookies, { name: key })

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

    cookie.value = _get(account, key, '')

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
  })
}

async function changeAccount(account: Account) {
  if (configStorage.accountChangeConfirm.value) {
    await withDialogPromise(dialog.warning, {
      title: '切换确认',
      content: `确认切换到账号 ${account.name}？`,
      positiveText: '确定',
      negativeText: '取消',
    })
  }

  await setCookies(account)

  multipleAccountsStorage.currentAccount.value = account.DedeUserID
}

async function removeAccount() {
  if (!selectedAccount) {
    return
  }

  await withDialogPromise(dialog.warning, {
    title: '删除确认',
    content: `确认删除 ${selectedAccount.name}？`,
    positiveText: '确定',
    negativeText: '取消',
  })

  _remove(multipleAccountsStorage.accounts.value, {
    DedeUserID: selectedAccount.DedeUserID,
  })
}

const handle = {
  getOptions: (account: Account) => [
    {
      key: 'header',
      type: 'render',
      render() {
        return h('div', {
          class: 'p-3 flex items-center gap-3',
        }, [
          h(NButton, {
            type: 'error',
            ghost: true,
            onClick: () => removeAccount(),
          }, '删除'),
          h(NButton, {
            type: 'error',
            ghost: true,
            disabled: !isCurrentAccount(account),
            onClick: () => {
              setCookies()
              multipleAccountsStorage.currentAccount.value = ''
            },
          }, '暂离'),
        ])
      },
    },
  ],
  select(account: Account) {
    selectedAccount = account
  },
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
        }" flex justify-between items-center gap-3 b="~ solid" rounded-2 px-3 py-1
      >
        <div flex="~ 1" items-center gap-3>
          <img :src="account.face" h-10 w-10 rounded-2>

          <div class="name" max-w-46 text-5 text-truncate>
            {{ account.name }}
          </div>
        </div>

        <div flex gap-2>
          <NButton type="success" :disabled="isCurrentAccount(account)" @click="changeAccount(account)">
            切换
          </NButton>

          <NDropdown trigger="click" :show-arrow="true" :options="handle.getOptions(account)">
            <NButton secondary @click="handle.select(account)">
              更多
            </NButton>
          </NDropdown>
        </div>
      </div>
    </div>
  </n-scrollbar>
</template>

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
