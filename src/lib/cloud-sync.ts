import type { CloudEvent, SyncPage } from '../../shared/cloud.ts'
import { acceptPage, getJournal, markSynced } from './cloud-store.ts'

export type CloudRequest = (owner: string, method: 'GET' | 'POST', body?: unknown, cursor?: number) => Promise<unknown>
export async function pullJournal(owner: string, request: CloudRequest, stillActive: () => boolean) {
  let cursor = getJournal(owner).cursor
  for (;;) {
    if (!stillActive()) throw new Error('账号已切换，本次同步已停止。')
    const page = await request(owner, 'GET', undefined, cursor) as SyncPage
    if (!stillActive()) throw new Error('账号已切换，本次同步已停止。')
    if (!Array.isArray(page.changes) || !Number.isSafeInteger(page.nextCursor) || page.nextCursor < cursor || typeof page.hasMore !== 'boolean' || (page.hasMore && page.nextCursor === cursor)) throw new Error('云端分页数据异常，本地记录已保留，请重试。')
    acceptPage(owner, page)
    cursor = page.nextCursor
    if (!page.hasMore) break
  }
}
export async function syncJournal(owner: string, request: CloudRequest, stillActive: () => boolean) {
  const upload: CloudEvent[] = [...getJournal(owner).pending]
  for (let i = 0; i < upload.length; i += 50) {
    if (!stillActive()) throw new Error('账号已切换，本次同步已停止。')
    await request(owner, 'POST', { events: upload.slice(i, i + 50) })
  }
  await pullJournal(owner, request, stillActive)
  if (!stillActive()) throw new Error('账号已切换，本次同步已停止。')
  const unconfirmed = new Set(getJournal(owner).pending.map((event) => event.id))
  if (upload.some((event) => unconfirmed.has(event.id))) throw new Error('云端尚未确认已上传的记录；本地记录已保留，请重试同步。')
  markSynced(owner)
}
