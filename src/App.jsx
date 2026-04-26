import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider } from './lib/AuthContext'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Devis from './pages/Devis'
import NewDevis from './pages/NewDevis'
import EditDevis from './pages/EditDevis'
import Clients from './pages/Clients'
import Factures from './pages/Factures'
import ClientDetail from './pages/ClientDetail'
import Rappels from './pages/Rappels'
import Profil from './pages/Profil'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MentionsLegales from './pages/MentionsLegales'
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite'
import ConditionsUtilisation from './pages/ConditionsUtilisation'
import Conformite from './pages/Conformite'
import CGV from './pages/CGV'
import DevisPublic from './pages/DevisPublic'

function App() {
  useEffect(() => {
    if (!navigator.serviceWorker) return
    const handler = (event) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        toast(event.data.body || event.data.title, {
          icon: '🔔',
          duration: 5000,
        })
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: '14px' } }} />
      <PwaUpdatePrompt />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/devis" element={<Devis />} />
        <Route path="/devis/nouveau" element={<NewDevis />} />
        <Route path="/devis/:id/modifier" element={<EditDevis />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/factures" element={<Factures />} />
        <Route path="/rappels" element={<Rappels />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />
        <Route path="/conformite" element={<Conformite />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/devis/public/:token" element={<DevisPublic />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
