import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import { r } from './scripts/utils'
import { sharedConfig } from './vite.config.mts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      coverage: {
        reportsDirectory: r('.coverage')
      }
    }
  })
)
