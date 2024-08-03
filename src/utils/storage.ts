export function withComputed<T>(data: Ref<T>) {
  return computed<T>({
    get() {
      return data.value
    },
    set(value) {
      data.value = value
    },
  })
}
