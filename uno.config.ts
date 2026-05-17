import { unoColors } from 'uno-colors'
import { defineConfig, presetAttributify, presetIcons, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      cdn: 'https://esm.sh/',
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'text-bottom'
      }
    })
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
