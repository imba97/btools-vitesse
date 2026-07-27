import { writeManifest } from './manifest'
// build-only entry: regenerate extension/manifest.json from src/manifest.ts.
// Must not write to extension/dist/{popup,options}/index.html — that output
// belongs to `vite build` and the dev stub lives in scripts/dev-prepare.ts.
import { isDev, log } from './utils'

if (isDev) {
  // `pnpm run build:prepare` should never run in dev mode. The dev stub
  // lives in scripts/dev-prepare.ts and is wired to `dev:prepare` in
  // package.json. Warn loudly so any accidental misuse is visible, but
  // still allow the manifest to be written so cross-env misconfigurations
  // don't block the build chain entirely.
  log('PRE', 'warning: build:prepare invoked with NODE_ENV!=production')
}

writeManifest()
