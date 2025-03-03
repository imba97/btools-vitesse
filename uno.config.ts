import { unoColors } from 'uno-colors'
import { presetAttributify, presetIcons, presetWind3, transformerDirectives } from 'unocss'
import { defineConfig } from 'unocss/vite'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons()
  ],
  transformers: [
    transformerDirectives()
  ],
  theme: {
    colors: unoColors({
      primary: '#18a058'
    })
  }
})
