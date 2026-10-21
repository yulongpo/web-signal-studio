import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installM06E2eHook } from './projectIo'

// Always-on thin install so Playwright can drive marks / undo via window.__wssM06.
installM06E2eHook(window)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
