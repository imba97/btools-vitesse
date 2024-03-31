export const withComputed = <T>(data: Ref<T>) => computed<T>({
  get() {
    return data.value
  },
  set(value) {
    data.value = value
  },
})
