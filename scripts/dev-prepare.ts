// dev-only entry: stub extension/dist/{popup,options}/index.html so the
// extension loads scripts from the running Vite dev server, and watch
// source files to keep manifest/stub in sync during development.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import chokidar from 'chokidar'
import { writeManifest } from './manifest'
import { isDev, log, port, r } from './utils'

/**
 * Stub index.html to use Vite in development
 */
async function stubIndexHtml() {
  const views = ['options', 'popup']

  for (const view of views) {
    await mkdir(r(`extension/dist/${view}`), { recursive: true })
    let data = await readFile(r(`src/${view}/index.html`), 'utf-8')
    data = data
      .replace('"./main.ts"', `"http://localhost:${port}/${view}/main.ts"`)
      .replace('<div id="app"></div>', '<div id="app">Vite server did not start</div>')
    await writeFile(r(`extension/dist/${view}/index.html`), data, 'utf-8')
    log('PRE', `stub ${view}`)
  }
}

if (!isDev) {
  // Guard against accidental use during a production build. The dev stub
  // must never overwrite Vite build output in extension/dist/.
  log('PRE', 'skip dev-prepare: NODE_ENV=production')
  process.exit(0)
}

writeManifest()
  .then(() => stubIndexHtml())
  .then(() => {
    chokidar.watch(r('src/**/*.html'))
      .on('change', () => {
        stubIndexHtml()
      })

    chokidar.watch([r('src/manifest.ts'), r('package.json')])
      .on('change', () => {
        writeManifest()
      })
  })
