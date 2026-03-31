import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const windowMode =
  new URLSearchParams(window.location.search).get('window') === 'panel' ? 'panel' : 'main'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App windowMode={windowMode} />
  </StrictMode>
)
