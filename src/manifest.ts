import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import fs from 'fs-extra'
import { isDev, isFirefox, port, r } from '../scripts/utils'

export async function getManifest() {
  const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    action: {
      default_icon: './assets/logo.png',
      default_popup: './dist/popup/index.html'
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true
    },
    background: isFirefox
      ? {
          scripts: ['dist/background/index.mjs'],
          type: 'module'
        }
      : {
          service_worker: './dist/background/index.mjs'
        },
    icons: {
      16: './assets/logo.png',
      48: './assets/logo.png',
      128: './assets/logo.png'
    },
    permissions: [
      'tabs',
      'storage',
      'webRequest',
      'activeTab',
      'cookies'
    ],
    host_permissions: ['*://*/*'],
    content_scripts: [
      {
        matches: [
          '<all_urls>'
        ],
        js: [
          'dist/contentScripts/index.global.js'
        ]
      }
    ],
    web_accessible_resources: [
      {
        resources: [
          'dist/contentScripts/*.css'
        ],
        matches: ['<all_urls>']
      }
    ],
    content_security_policy: {
      extension_pages: isDev
        // this is required on dev for Vite script to load
        ? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
        : 'script-src \'self\'; object-src \'self\''
    }
  }

  return manifest
}
