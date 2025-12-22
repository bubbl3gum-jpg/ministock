import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './BubbleBiz.css' // Import BubbleBiz styles globally
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
