import { unoColors } from 'uno-colors'
import { defineConfig, presetAttributify, presetIcons, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  // dark variant 走 @media (prefers-color-scheme: dark)，不走 .dark class：
  // 我们的 host 在 B 站 main DOM，B 站不会给我们 body/html 加 .dark 类。
  dark: 'media',
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
