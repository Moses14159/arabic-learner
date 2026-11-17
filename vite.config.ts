import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
  let role = ''
  if (key.startsWith('eyJ')) {
    try { role = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString()).role ?? '' } catch { /* Invalid public keys fail during authentication. */ }
  }
  if (key.startsWith('sb_secret_') || role === 'service_role') {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a public key. Keep Supabase secret/service-role keys in server-only environment variables.')
  }
  return { plugins: [react()] }
})
