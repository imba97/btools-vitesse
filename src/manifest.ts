import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { readFile } from 'node:fs/promises'
import { isDev, isFirefox, port, r } from '../scripts/utils'

const contentScriptMatches = [
  '*://*.bilibili.com/*',
  '*://bilibili.com/*'
]

const hostPermissionMatches = [
  ...contentScriptMatches,
  '*://*.biliplus.com/*'
]

export async function getManifest() {
  const pkg = JSON.parse(await readFile(r('package.json'), 'utf-8')) as typeof PkgType
  const permissions: Manifest.WebExtensionManifest['permissions'] = [
    'tabs',
    'storage',
    'activeTab',
    'cookies',
    'alarms'
  ]

  if (!isFirefox) {
    permissions.push('scripting')
  }

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    action: {
      default_icon: 'assets/logo.png',
      default_popup: 'dist/popup/index.html'
    },
    options_ui: {
      page: 'dist/options/index.html',
      open_in_tab: true
    },
    background: isFirefox
      ? {
          scripts: ['dist/background/index.mjs'],
          type: 'module'
        }
      : {
          service_worker: 'dist/background/index.mjs'
        },
    icons: {
      16: 'assets/logo.png',
      48: 'assets/logo.png',
      128: 'assets/logo.png'
    },
    permissions,
    host_permissions: hostPermissionMatches,
    content_scripts: [
      {
        matches: contentScriptMatches,
        js: [
          'dist/contentScripts/index.global.js'
        ]
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
