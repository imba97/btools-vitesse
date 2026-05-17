import { RequestError, useRequest } from './request'

describe('useRequest', () => {
  const baseUrl = 'https://api.example.com'

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed data when response is ok', async () => {
    const payload = { code: 0, data: { ok: true } }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload)
    } as unknown as Response)

    const request = useRequest(baseUrl)
    const result = await request.get<typeof payload>('/ok')

    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries once for retryable errors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ code: 0 })
      } as unknown as Response)

    const request = useRequest(baseUrl)
    const result = await request.get('/retry', undefined, {
      retries: 1,
      retryDelayMs: 0
    })

    expect(result).toEqual({ code: 0 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws RequestError when response status is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('service unavailable')
    } as unknown as Response)

    const request = useRequest(baseUrl)
    const pendingRequest = request.get('/bad')

    await expect(pendingRequest).rejects.toBeInstanceOf(RequestError)
    await expect(pendingRequest).rejects.toMatchObject({
      status: 503
    })
  })
})
