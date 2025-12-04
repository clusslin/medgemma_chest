import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Loading from './components/Loading'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DicomSettings = lazy(() => import('./pages/DicomSettings'))
const ProcessingList = lazy(() => import('./pages/ProcessingList'))
const ResultList = lazy(() => import('./pages/ResultList'))
const PromptSettings = lazy(() => import('./pages/PromptSettings'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<Loading />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="dicom-settings"
          element={
            <Suspense fallback={<Loading />}>
              <DicomSettings />
            </Suspense>
          }
        />
        <Route
          path="processing"
          element={
            <Suspense fallback={<Loading />}>
              <ProcessingList />
            </Suspense>
          }
        />
        <Route
          path="results"
          element={
            <Suspense fallback={<Loading />}>
              <ResultList />
            </Suspense>
          }
        />
        <Route
          path="prompts"
          element={
            <Suspense fallback={<Loading />}>
              <PromptSettings />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
