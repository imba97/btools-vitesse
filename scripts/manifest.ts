import { mkdir, writeFile } from 'node:fs/promises'
import { getManifest } from '../src/manifest'
import { log, r } from './utils'

export async function writeManifest() {
  await mkdir(r('extension'), { recursive: true })
  await writeFile(
    r('extension/manifest.json'),
    `${JSON.stringify(await getManifest(), null, 2)}\n`,
    'utf-8'
  )
  log('PRE', 'write manifest.json')
}

writeManifest()
