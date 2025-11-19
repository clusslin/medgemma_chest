import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DicomSettings from './pages/DicomSettings'
import ProcessingList from './pages/ProcessingList'
import ResultList from './pages/ResultList'
import PromptSettings from './pages/PromptSettings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dicom-settings" element={<DicomSettings />} />
        <Route path="processing" element={<ProcessingList />} />
        <Route path="results" element={<ResultList />} />
        <Route path="prompts" element={<PromptSettings />} />
      </Route>
    </Routes>
  )
}

export default App
