export {}
declare global {
  const browser: typeof import('webextension-polyfill')
}

declare module 'vue' {
  import type { Browser } from 'webextension-polyfill'

  interface ComponentCustomProperties {
    readonly browser: Browser
  }
}

declare module '@vue/runtime-core' {
  import type { Browser } from 'webextension-polyfill'

  interface ComponentCustomProperties {
    readonly browser: Browser
  }
}
