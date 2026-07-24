import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── DEV ONLY: install global debug interceptors ────────────────────────────────
// Patches fetch, history, localStorage, and error handlers to log into the
// floating debug panel. Zero overhead in production — guard is constant-folded.
if (import.meta.env.DEV) {
  import('@/shared/debug/interceptors').then(({ installDebugInterceptors }) => {
    installDebugInterceptors();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
