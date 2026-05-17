import { resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'

export const port = Number(process.env.PORT || '') || 3303
export const r = (...args: string[]) => resolve(__dirname, '..', ...args)
export const isDev = process.env.NODE_ENV !== 'production'
export const isFirefox = process.env.EXTENSION === 'firefox'

export function log(name: string, message: string) {
  console.log(styleText(['black', 'bgCyan'], ` ${name} `), message)
}
