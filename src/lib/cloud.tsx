import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'
import type { AttemptPayload } from '../../shared/cloud.ts'
import {
  completeImport, getImportDraft, getJournal, getStorageError, getStoreRevision,
  markSynced, prepareImport, queueAttempt, retryLocalWrites, setScope, subscribeStore,
} from './cloud-store'
import { pullJournal, syncJournal } from './cloud-sync'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const client = url && key ? createClient(url, key) : null
export const recordAttempt = (payload: AttemptPayload) => queueAttempt(payload)
type Status = 'unconfigured' | 'guest' | 'loading' | 'syncing' | 'pending' | 'synced' | 'error'
interface CloudContextValue {
  user: User | null
  configured: boolean
  loading: boolean
  busy: boolean
  status: Status
  error: string | null
  pendingCount: number
  lastSyncedAt: number
  importState: 'available' | 'retry' | 'complete' | 'other-account'
  signIn: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  sync: () => Promise<void>
  importGuest: () => Promise<void>
}
const CloudContext = createContext<CloudContextValue | null>(null)
const message = (error: unknown) => error instanceof Error ? error.message : '操作失败，请稍后重试。'

export function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(client))
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeUser = useRef<string | null>(null)
  const running = useRef<{ userId: string; promise: Promise<void> } | null>(null)
  useSyncExternalStore(subscribeStore, getStoreRevision, getStoreRevision)
  const user = session?.user ?? null
  const userId = user?.id ?? null

  const changeSession = useCallback((next: Session | null) => {
    const nextId = next?.user.id ?? null
    const changed = activeUser.current !== nextId
    activeUser.current = nextId
    setScope(nextId)
    setSession(next)
    setLoading(false)
    if (changed) { setSyncing(false); setError(null); setBusy(false) }
  }, [])

  useEffect(() => {
    if (!client) { setScope(null); return }
    let mounted = true
    // Only the initial response may initialize state; an auth event can arrive first.
    let initialized = false
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (mounted) { initialized = true; changeSession(next) }
    })
    client.auth.getSession().then(({ data, error: authError }) => {
      if (!mounted || initialized) return
      changeSession(data.session)
      if (authError) setError(authError.message)
    }).catch((authError: unknown) => { if (mounted && !initialized) { setLoading(false); setError(message(authError)) } })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [changeSession])

  const request = useCallback(async (owner: string, method: 'GET' | 'POST', body?: unknown, cursor = 0) => {
    if (!client || activeUser.current !== owner) throw new Error('账号已切换，本次同步已停止。')
    const { data, error: authError } = await client.auth.getSession()
    if (authError || !data.session || data.session.user.id !== owner || activeUser.current !== owner) throw new Error('登录已失效，请重新登录后同步。')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    let response: Response
    try {
      response = await fetch(method === 'GET' ? `/api/learning?cursor=${cursor}` : '/api/learning', {
        method,
        headers: { Authorization: `Bearer ${data.session.access_token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: controller.signal,
      })
    } finally { clearTimeout(timeout) }
    if (activeUser.current !== owner) throw new Error('账号已切换，本次同步已停止。')
    let payload: unknown
    try { payload = await response.json() } catch { throw new Error('云端接口没有返回有效数据，请检查 Vercel 后端配置后重试。') }
    if (!response.ok) {
      const detail = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `请求失败（${response.status}）`
      throw new Error(detail)
    }
    return payload
  }, [])

  const pull = useCallback((owner: string) => pullJournal(owner, request, () => activeUser.current === owner), [request])

  const sync: () => Promise<void> = useCallback(async () => {
    const owner = activeUser.current
    if (!owner || !client) return
    if (running.current?.userId === owner) return running.current.promise
    const promise = (async () => {
      setSyncing(true)
      setError(null)
      retryLocalWrites()
      let completed = false
      try {
        await syncJournal(owner, request, () => activeUser.current === owner)
        completed = true
      } catch (syncError) {
        if (activeUser.current === owner) setError(`同步未完成：${message(syncError)}`)
      } finally {
        if (running.current?.userId === owner) running.current = null
        if (activeUser.current === owner) {
          setSyncing(false)
          // A write during an in-flight upload may have consumed the ordinary debounce wakeup.
          if (completed && getJournal(owner).pending.length) window.setTimeout(() => { if (activeUser.current === owner) void sync() }, 700)
        }
      }
    })()
    running.current = { userId: owner, promise }
    return promise
  }, [request])

  const pendingCount = userId ? getJournal(userId).pending.length : 0
  useEffect(() => {
    if (!userId) return
    const timer = window.setTimeout(() => { void sync() }, 700)
    return () => clearTimeout(timer)
  }, [userId, pendingCount, sync])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void sync() }
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [sync])

  const authAction = useCallback(async (action: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await action() } catch (authError) { setError(message(authError)); throw authError } finally { setBusy(false) }
  }, [])
  const signIn = useCallback((email: string) => authAction(async () => {
    if (!client) throw new Error('云端登录尚未配置。')
    const { error: authError } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (authError) throw authError
  }), [authAction])
  const verifyOtp = useCallback((email: string, token: string) => authAction(async () => {
    if (!client) throw new Error('云端登录尚未配置。')
    const { error: authError } = await client.auth.verifyOtp({ email, token, type: 'email' })
    if (authError) throw authError
  }), [authAction])
  const signOut = useCallback(() => authAction(async () => {
    if (!client) return
    const { error: authError } = await client.auth.signOut({ scope: 'local' })
    if (authError) throw authError
    changeSession(null)
  }), [authAction, changeSession])
  const importGuest = useCallback(async () => {
    const owner = activeUser.current
    if (!owner) return
    setBusy(true); setError(null)
    retryLocalWrites()
    try {
      const draft = await prepareImport(owner, () => activeUser.current === owner)
      await request(owner, 'POST', { import: draft })
      await pull(owner)
      if (activeUser.current === owner) { await completeImport(owner, draft.id); if (activeUser.current === owner) markSynced(owner) }
    } catch (importError) {
      if (activeUser.current === owner) setError(`导入未完成：${message(importError)}`)
    } finally { if (activeUser.current === owner) setBusy(false) }
  }, [pull, request])

  const storageFailure = getStorageError()
  const journal = userId ? getJournal(userId) : null
  const draft = getImportDraft()
  const importState = !draft ? 'available' : draft.ownerId !== userId ? 'other-account' : draft.completed ? 'complete' : 'retry'
  const status: Status = error || storageFailure ? 'error' : loading ? 'loading' : !client ? 'unconfigured' : !user ? 'guest' : syncing ? 'syncing' : pendingCount ? 'pending' : journal?.syncedAt ? 'synced' : 'loading'
  const value = useMemo<CloudContextValue>(() => ({ user, configured: Boolean(client), loading, busy, status, error: error ?? storageFailure, pendingCount, lastSyncedAt: journal?.syncedAt ?? 0, importState, signIn, verifyOtp, signOut, sync, importGuest }), [user, loading, busy, status, error, storageFailure, pendingCount, journal?.syncedAt, importState, signIn, verifyOtp, signOut, sync, importGuest])
  return <CloudContext.Provider value={value}>{loading ? <p role="status" className="muted" style={{ padding: 24 }}>正在恢复登录状态…</p> : <Fragment key={userId ?? 'guest'}>{children}</Fragment>}</CloudContext.Provider>
}

export function useCloud() {
  const context = useContext(CloudContext)
  if (!context) throw new Error('useCloud requires CloudProvider')
  return context
}
