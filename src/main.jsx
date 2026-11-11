import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { initSharedStorage } from './services/sharedStorage.js'

async function bootstrap() {
  await initSharedStorage()
  const [{ default: App }, { AuthProvider }] = await Promise.all([
    import('./App.jsx'),
    import('./context/AuthContext.jsx'),
  ])

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

bootstrap()
