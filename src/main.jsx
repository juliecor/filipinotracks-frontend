import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Reduced to 3 weights (400 / 600 / 800) — saves ~80KB on initial load.
// 500 and 700 weights auto-substitute from these via MUI typography.
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/800.css'
import App from './App.jsx'
import { ColorModeProvider } from './context/ColorModeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ColorModeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ColorModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
