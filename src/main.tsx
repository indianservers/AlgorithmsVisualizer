import './account/bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { StringSuite } from './components/StringSuite'
import { HomeDashboard } from './home/HomeDashboard.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

import './compact-workbench.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/strings/string-pattern-matching-suite" element={<StringSuite />} />
          <Route path="/:categorySlug" element={<App />} />
          <Route path="/:categorySlug/:algorithmSlug" element={<App />} />
          <Route path="*" element={<App />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
