import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useCloud } from '../lib/cloud'
import { guestSnapshot } from '../lib/cloud-store'
import './Account.css'

const STATUS = {
  unconfigured: '当前浏览器保存', guest: '游客学习', loading: '正在读取', syncing: '正在同步',
  pending: '等待同步', synced: '已与云端同步', error: '需要重试',
}

export function Account() {
  const cloud = useCloud()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  const sendCode = async () => {
    try {
      await cloud.signIn(email.trim())
      setSentTo(email.trim()); setCooldown(60)
      setNotice('登录邮件已发送。输入邮件中的验证码；如果邮件提供登录链接，也可以点击链接登录。')
    } catch { setNotice('') }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!sentTo) { await sendCode(); return }
    try { await cloud.verifyOtp(sentTo, code.trim()); setCode(''); setNotice('') } catch { setNotice('') }
  }
  const snapshot = guestSnapshot()
  const hasGuestRecords = snapshot.sessions.length > 0 || Object.keys(snapshot.lessonScores).length > 0 || Object.keys(snapshot.independentScores).length > 0 || Object.keys(snapshot.book).length > 0 || Object.keys(snapshot.tajweed).length > 0
  const blocked = cloud.busy || cloud.status === 'syncing'
  return <details className="account-panel" onKeyDown={(event) => event.stopPropagation()}>
    <summary className="account-summary">
      <span><b>{cloud.user ? '我的学习账号' : '保存你的学习积累'}</b><small>{cloud.user?.email ?? (cloud.configured ? '先试学，随时登录保存' : '游客模式也可以继续学习')}</small></span>
      <span className={`account-status account-status--${cloud.status}`}>{STATUS[cloud.status]}</span>
    </summary>
    <div className="account-body">
      {cloud.error && <p className="account-error" role="alert">{cloud.error}</p>}
      {!cloud.configured ? <p className="muted">云端账号暂未开放。当前学习记录保存在这个浏览器，清理站点数据会删除记录。</p> : cloud.user ? <>
        <p className="account-email">已登录：<b>{cloud.user.email}</b></p>
        <p className="muted" role="status">{cloud.pendingCount ? `${cloud.pendingCount} 条记录等待上传。关闭页面前可检查同步状态。` : cloud.status === 'synced' ? '已同步的练习记录可以在其他设备登录后恢复。' : '正在读取该账号的学习记录。'}{cloud.lastSyncedAt > 0 && <small className="account-last-sync">上次同步：{new Date(cloud.lastSyncedAt).toLocaleString('zh-CN')}</small>}</p>
        <div className="account-actions">
          <button className="btn btn--sm" type="button" disabled={blocked} onClick={() => { void cloud.sync() }}>{cloud.status === 'syncing' ? '正在同步…' : cloud.error ? '重试同步' : '立即同步'}</button>
          <button className="btn btn--ghost btn--sm" type="button" disabled={cloud.busy} onClick={() => { void cloud.signOut().catch(() => {}) }}>退出账号</button>
        </div>
        <section className="account-import" aria-label="导入游客记录">
          <b>保留已有的游客记录</b>
          <p className="muted">{cloud.importState === 'complete' ? '这份游客记录已导入。原始本地记录仍保留，历史成绩会标为导入记录。' : cloud.importState === 'other-account' ? '这份游客记录已绑定其他账号，不会混入当前账号。' : hasGuestRecords ? `此浏览器中有 ${snapshot.sessions.length} 轮游客练习及已有的课程、错词或规则记录。点击后会导入当前账号；旧成绩不会转换为新的复测结果。` : '此浏览器暂无游客学习记录。你现在的练习将保存在当前账号下。'}</p>
          <button className="btn btn--ghost btn--sm" type="button" disabled={blocked || !hasGuestRecords || cloud.importState === 'complete' || cloud.importState === 'other-account'} onClick={() => { void cloud.importGuest() }}>{cloud.busy ? '正在处理…' : cloud.importState === 'retry' ? '继续导入这份记录' : cloud.importState === 'complete' ? '已导入' : '导入到当前账号'}</button>
        </section>
      </> : <>
        <p className="muted">登录后可同步练习记录，在其他设备继续学习。游客记录会保留，登录后可选择导入。</p>
        <form className="account-form" onSubmit={(event) => { void submit(event) }}>
          <label htmlFor="qalam-account-email">邮箱</label>
          <input id="qalam-account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={cloud.busy || Boolean(sentTo)} placeholder="you@example.com" />
          {sentTo && <>
            <label htmlFor="qalam-account-code">邮件验证码</label>
            <input id="qalam-account-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required maxLength={12} disabled={cloud.busy} />
          </>}
          <button className="btn btn--gold" type="submit" disabled={cloud.busy}>{cloud.busy ? '正在处理…' : sentTo ? '验证并登录' : '发送登录邮件'}</button>
          {sentTo && <div className="account-actions">
            <button className="btn btn--ghost btn--sm" type="button" disabled={cloud.busy || cooldown > 0} onClick={() => { void sendCode() }}>{cooldown > 0 ? `${cooldown} 秒后可重发` : '重新发送'}</button>
            <button className="btn btn--ghost btn--sm" type="button" disabled={cloud.busy} onClick={() => { setSentTo(''); setCode(''); setNotice('') }}>更换邮箱</button>
          </div>}
          {notice && <p className="account-notice" role="status">{notice}</p>}
        </form>
      </>}
    </div>
  </details>
}
