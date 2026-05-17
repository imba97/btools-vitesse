type MaybePromise<T> = T | Promise<T>

export abstract class BaseHandler {
  abstract prepare(): MaybePromise<void>
  abstract handle(): MaybePromise<void>
}
