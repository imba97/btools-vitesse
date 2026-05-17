import { readdir, rm } from 'node:fs/promises'
import { r } from './utils'

async function clean() {
  await Promise.all([
    rm(r('extension/dist'), { recursive: true, force: true }),
    rm(r('extension/manifest.json'), { force: true })
  ])

  const rootEntries = await readdir(r())
  const extensionArtifacts = rootEntries.filter(name => name.startsWith('extension.'))
  await Promise.all(
    extensionArtifacts.map(name => rm(r(name), { recursive: true, force: true }))
  )
}

clean()
