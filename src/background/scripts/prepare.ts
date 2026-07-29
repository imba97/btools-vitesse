import { ensureWbiKeys } from '~/api/wbi-service'

export async function refreshWbiIfNeeded(force = false): Promise<boolean> {
  try {
    await ensureWbiKeys(force)
    return true
  }
  catch {
    return false
  }
}
