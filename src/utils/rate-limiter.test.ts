import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs up to maxConcurrent tasks at once', async () => {
    const lim = new RateLimiter({ maxConcurrent: 2, intervalMs: 1000 })
    const started: number[] = []
    // 任务耗时 100ms，所以总耗时 = 100ms(前两个) + 1000ms cooldown + 100ms(后两个) = 1200ms
    const tasks = [0, 1, 2, 3].map(i => () => {
      started.push(i)
      return new Promise<number>(r => setTimeout(r, 100, i))
    })

    const promises = tasks.map(t => lim.enqueue(t))
    await vi.advanceTimersByTimeAsync(0)
    expect(started.sort()).toEqual([0, 1])

    await vi.advanceTimersByTimeAsync(1200)
    expect((await Promise.all(promises)).sort((a, b) => a - b)).toEqual([0, 1, 2, 3])
  })

  it('enforces 1s gap per slot before the next task on that slot', async () => {
    const lim = new RateLimiter({ maxConcurrent: 1, intervalMs: 1000 })
    const startedAt: number[] = []
    const tasks = [0, 1, 2].map(i => async () => {
      startedAt.push(Date.now())
      await new Promise(r => setTimeout(r, 50))
      return i
    })

    const promises = tasks.map(t => lim.enqueue(t))
    // Task 0 starts at t=0, finishes at t=50. Slot cooldown until t=1050.
    await vi.advanceTimersByTimeAsync(50)
    expect(startedAt).toEqual([0])
    // Advance to t=1050 → task 1 starts
    await vi.advanceTimersByTimeAsync(1000)
    expect(startedAt).toEqual([0, 1050])
    // Advance to finish task 1 + cooldown → task 2 starts at t=1100+1000=2100
    await vi.advanceTimersByTimeAsync(1050)
    expect(startedAt).toEqual([0, 1050, 2100])
    // task 2 还需 50ms 跑完
    await vi.advanceTimersByTimeAsync(50)

    await Promise.all(promises)
  })

  it('with 2 slots, throughput is 2 per intervalMs', async () => {
    const lim = new RateLimiter({ maxConcurrent: 2, intervalMs: 1000 })
    const startedAt: number[] = []
    const tasks = [0, 1, 2, 3].map(i => async () => {
      startedAt.push(Date.now())
      return i
    })

    const promises = tasks.map(t => lim.enqueue(t))
    // Tasks 0 and 1 start at t=0
    await vi.advanceTimersByTimeAsync(0)
    expect(startedAt.sort()).toEqual([0, 0])
    // Cooldown until t=1000 for both slots → tasks 2 and 3 start
    await vi.advanceTimersByTimeAsync(1000)
    expect(startedAt.sort()).toEqual([0, 0, 1000, 1000])

    await Promise.all(promises)
  })

  it('propagates errors and frees the slot', async () => {
    const lim = new RateLimiter({ maxConcurrent: 1, intervalMs: 100 })
    const fail = lim.enqueue(async () => {
      throw new Error('boom')
    })
    // 立刻挂 noop catch 避免 unhandled rejection 警告
    void fail.catch(() => {})
    const ok = lim.enqueue(async () => 'ok')

    await vi.advanceTimersByTimeAsync(0)
    await expect(fail).rejects.toThrow('boom')
    // After failure, slot is freed after cooldown (100ms)
    await vi.advanceTimersByTimeAsync(100)
    expect(await ok).toBe('ok')
  })

  it('pending reflects queue length', () => {
    const lim = new RateLimiter({ maxConcurrent: 1, intervalMs: 1000 })
    expect(lim.pending).toBe(0)
    void lim.enqueue(async () => 'a')
    void lim.enqueue(async () => 'b')
    expect(lim.pending).toBe(1) // one is immediately running, one queued
  })
})
