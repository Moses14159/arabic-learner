import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const alice = '10000000-0000-4000-8000-000000000001'
const bob = '10000000-0000-4000-8000-000000000002'
const eventId = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const event = (n, type = 'mistakes-clear') => ({ id: eventId(n), type, at: 1794787200000, payload: {} })
const asRole = (role, user, action) => db.transaction(async (tx) => {
  await tx.exec(`set local role ${role}`)
  await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user])
  return action(tx)
})
const rpc = (role, user, name, args, types) => asRole(role, user, (tx) => tx.query(
  `select public.${name}(${types.map((type, index) => `$${index + 1}::${type}`).join(',')}) as result`, args,
))
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `)
  await db.query('insert into auth.users values ($1),($2)', [alice, bob])
  await db.exec(await readFile(new URL('../supabase/migrations/202611160001_learning_sync.sql', import.meta.url), 'utf8'))

  const append = (user, events) => rpc('service_role', '', 'qalam_append_learning', [user, JSON.stringify(events)], ['uuid', 'jsonb'])
  const pull = (user, cursor = 0, limit = 200) => rpc('service_role', '', 'qalam_pull_learning', [user, cursor, limit], ['uuid', 'bigint', 'integer'])
  assert.equal((await append(alice, [event(1), event(2)])).rows[0].result, 2)
  assert.equal((await append(alice, [event(1)])).rows[0].result, 0, 'Retransmission must not duplicate an attempt')
  await append(bob, [event(1)])
  const imported = { id: eventId(3), snapshot: { sessions: [], lessonScores: { intro: 80 } } }
  const importArgs = [alice, JSON.stringify(imported)]
  assert.equal((await rpc('service_role', '', 'qalam_import_learning', importArgs, ['uuid', 'jsonb'])).rows[0].result, 1)
  assert.equal((await rpc('service_role', '', 'qalam_import_learning', importArgs, ['uuid', 'jsonb'])).rows[0].result, 0)
  const first = (await pull(alice, 0, 1)).rows[0].result
  assert.equal(first.changes.length, 1)
  assert.equal(first.hasMore, true)
  const rest = (await pull(alice, first.nextCursor)).rows[0].result
  assert.equal(rest.changes.length, 2, 'Event and import must share a complete cursor stream')
  assert.ok(rest.changes.some((change) => change.import?.id === imported.id))
  assert.equal(rest.hasMore, false)
  assert.equal((await pull(bob)).rows[0].result.changes.length, 1)
  assert.equal((await pull(alice, rest.nextCursor)).rows[0].result.changes.length, 0)

  const own = await asRole('authenticated', alice, (tx) => tx.query('select user_id from public.qalam_learning_events'))
  assert.equal(own.rows.length, 2)
  assert.ok(own.rows.every((row) => row.user_id === alice), 'RLS must hide another account')
  const ownImports = await asRole('authenticated', bob, (tx) => tx.query('select * from public.qalam_legacy_imports'))
  assert.equal(ownImports.rows.length, 0)
  await assert.rejects(asRole('anon', '', (tx) => tx.query('select * from public.qalam_learning_events')), /permission denied/)
  await assert.rejects(asRole('authenticated', alice, (tx) => tx.query(
    'insert into public.qalam_learning_events(user_id,id,event) values($1,$2,$3)', [alice, eventId(8), JSON.stringify(event(8))],
  )), /permission denied/)
  await assert.rejects(rpc('authenticated', alice, 'qalam_append_learning', [bob, JSON.stringify([event(9)])], ['uuid', 'jsonb']), /permission denied/)
  await assert.rejects(rpc('authenticated', alice, 'qalam_pull_learning', [bob, 0, 200], ['uuid', 'bigint', 'integer']), /permission denied/)

  await assert.rejects(append(alice, [event(4), event(5, 'unsupported')]), /check constraint/)
  assert.equal((await pull(alice, rest.nextCursor)).rows[0].result.changes.length, 0, 'A failed batch must commit no rows')
  await db.query('delete from auth.users where id=$1', [alice])
  assert.equal((await db.query('select count(*)::int as count from public.qalam_legacy_imports')).rows[0].count, 0)
  console.log('PostgreSQL migration, RLS isolation, server-only RPC, pagination, atomic batches and import idempotency checks passed.')
} finally {
  await db.close()
}
