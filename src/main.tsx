import { InputNavigation } from './encyclopedia/InputNavigation'
import { EncyclopediaDirectory, EncyclopediaPage } from './encyclopedia/EncyclopediaPage'
import { PageMetadata } from './encyclopedia/PageMetadata'
import { migrateLegacyHash } from './utils/legacyHash'
import './encyclopedia/encyclopedia.css'
import './account/bootstrap'
import { LoginInvitation } from './account/LoginInvitation'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { StringSuite } from './components/StringSuite'
import { HomeDashboard } from './home/HomeDashboard.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

import './compact-workbench.css'
import './problem-input.css'

migrateLegacyHash()
window.addEventListener('hashchange', migrateLegacyHash)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PageMetadata />
        <InputNavigation />
        <LoginInvitation />
        <Routes>
          <Route path="/encyclopedia" element={<EncyclopediaDirectory />} />
          <Route path="/:categorySlug/:algorithmSlug/learn" element={<EncyclopediaPage />} />
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/strings/string-pattern-matching-suite" element={<StringSuite />} />
          <Route path="/:categorySlug" element={<App />} />
          <Route path="/:categorySlug/:algorithmSlug" element={<App />} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
