import type { DialogOptions, DialogReactive } from 'naive-ui'

export function withDialogPromise(dialog: (options: DialogOptions) => DialogReactive, options: DialogOptions) {
  return new Promise((resolve, reject) => {
    let onPositiveClick: Function | undefined
    let onNegativeClick: Function | undefined

    if (_isFunction(options.onPositiveClick))
      onPositiveClick = options.onPositiveClick

    options.onPositiveClick = (e) => {
      if (onPositiveClick)
        onPositiveClick(e)

      resolve(e)
    }

    options.onNegativeClick = (e) => {
      if (onNegativeClick)
        onNegativeClick(e)

      reject(new Error('cancel'))
    }

    dialog(options)
  })
}
