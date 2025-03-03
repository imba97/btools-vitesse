import type { ModalFuncProps } from 'ant-design-vue'

interface ModalResult {
  destroy: () => void
  update: (configUpdate: ModalFuncProps) => void
}

export function promisifyModal({ update }: ModalResult) {
  return new Promise((resolve, reject) => {
    update({
      onOk() {
        resolve(true)
      },
      onCancel() {
        reject(new Error('canceled'))
      }
    })
  })
}
