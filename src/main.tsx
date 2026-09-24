import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HueStoreProvider } from './state'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HueStoreProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HueStoreProvider>
  </React.StrictMode>
)
