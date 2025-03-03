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
          <AButton type="primary" :disabled="isCurrentAccount(account)" @click="changeAccount(account)">
            切换
          </AButton>

          <ADropdown trigger="click">
            <AButton secondary @click="selectedAccount = account">
              更多
            </AButton>

            <template #overlay>
              <AMenu>
                <AMenuItem :disabled="!isCurrentAccount(account)" @click="leaveAccount">
                  暂离
                </AMenuItem>

                <AMenuItem @click="removeAccount">
                  <span size-full text-red-6>
                    删除
                  </span>
                </AMenuItem>
              </AMenu>
            </template>
          </ADropdown>
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

const [modal, ContextHolder] = Modal.useModal()

const selectedAccount = ref<Account | null>(null)

const accountsList = computed(() => multipleAccountsStorage.accounts.value)

function isCurrentAccount(account: Account) {
  return account.DedeUserID === multipleAccountsStorage.currentAccount.value
}

async function setCookies(account?: Account) {
  const cookies = await browser.cookies
    .getAll({
      domain: '.bilibili.com'
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
        value: ''
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
      value: cookie.value
    })
  })
}

async function changeAccount(account: Account) {
  if (configStorage.accountChangeConfirm.value) {
    await promisifyModal(
      modal.confirm({
        title: '切换确认',
        content: `确认切换到账号 ${account.name}？`
      })
    )
  }

  await setCookies(account)

  multipleAccountsStorage.currentAccount.value = account.DedeUserID
}

async function removeAccount() {
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
function leaveAccount() {
  setCookies()
  multipleAccountsStorage.currentAccount.value = ''
}
</script>
