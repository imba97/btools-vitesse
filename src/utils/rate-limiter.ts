// 通用限流器：N 并发槽位 + 每槽位 cooldown（任务完成后等 intervalMs 才接下一个）
//
// 例：new RateLimiter(2, 1000) → 最多 2 个并发，每槽位完成后等 1s 才接下一个
// 稳态吞吐：N/intervalMs = 2 req/s
// cooldown 从"任务完成"算起，所以相邻请求之间的间隔 ≥ intervalMs
export interface RateLimiterOptions {
  maxConcurrent?: number
  intervalMs?: number
}

interface Job<T> {
  task: () => Promise<T>
  resolve: (value: T) => void
  reject: (err: unknown) => void
}

export class RateLimiter {
  private readonly maxConcurrent: number
  private readonly intervalMs: number
  // 槽位"下次可被领取"的时刻 (ms)；0 表示空闲
  private readonly slots: number[]
  // 正在跑任务的槽位下标（cooldown 还没开始算）
  private readonly runningSlots = new Set<number>()
  private queue: Array<Job<unknown>> = []
  private nextWakeupTimer: ReturnType<typeof setTimeout> | undefined

  constructor(opts: RateLimiterOptions = {}) {
    this.maxConcurrent = opts.maxConcurrent ?? 2
    this.intervalMs = opts.intervalMs ?? 1000
    this.slots = Array.from<number>({ length: this.maxConcurrent }).fill(0)
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject } as Job<unknown>)
      this.pump()
    })
  }

  private pump(): void {
    const now = Date.now()
    let soonestFree = Number.POSITIVE_INFINITY

    for (let i = 0; i < this.slots.length; i++) {
      // 正在跑 → 跳过（cooldown 会在 finally 里写入 slots[i]）
      if (this.runningSlots.has(i))
        continue
      if (this.slots[i] > now) {
        // cooldown 中
        if (this.slots[i] < soonestFree)
          soonestFree = this.slots[i]
        continue
      }
      // 空闲可领
      if (this.queue.length === 0)
        return
      const job = this.queue.shift() as Job<unknown>
      this.runningSlots.add(i)
      void this.runJob(job, i)
    }

    // 还有任务排着 + 没有空闲槽位 → 等最近的槽位空出来再 pump
    if (this.queue.length > 0 && soonestFree !== Number.POSITIVE_INFINITY) {
      if (this.nextWakeupTimer !== undefined)
        clearTimeout(this.nextWakeupTimer)
      const wait = Math.max(0, soonestFree - Date.now())
      this.nextWakeupTimer = setTimeout(() => {
        this.nextWakeupTimer = undefined
        this.pump()
      }, wait)
    }
  }

  private async runJob<T>(job: Job<T>, slotIdx: number): Promise<void> {
    try {
      job.resolve(await job.task())
    }
    catch (err) {
      job.reject(err)
    }
    finally {
      // cooldown 从任务完成时刻起算
      this.slots[slotIdx] = Date.now() + this.intervalMs
      this.runningSlots.delete(slotIdx)
      this.pump()
    }
  }

  get pending(): number {
    return this.queue.length
  }
}
