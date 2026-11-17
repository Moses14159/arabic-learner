import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CloudProvider } from './lib/cloud'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudProvider><App /></CloudProvider>
  </StrictMode>,
)
