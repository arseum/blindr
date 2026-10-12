import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App.tsx'
import { DisplayPage } from './pages/DisplayPage.tsx'
import { ColorSchemeProvider } from './contexts/ColorSchemeContext.tsx'
import { initTimerLoop } from './timer.ts'

const isDisplay = new URLSearchParams(window.location.search).has('display')

// Démarre le timer singleton uniquement dans la fenêtre principale
if (!isDisplay) {
  initTimerLoop();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeProvider>
      {isDisplay ? <DisplayPage /> : <App />}
    </ColorSchemeProvider>
  </StrictMode>,
)
