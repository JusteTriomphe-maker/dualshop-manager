import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NouvelleVente from './pages/Ventes/NouvelleVente'
import HistoriqueVentes from './pages/Ventes/HistoriqueVentes'
import ListeProduits from './pages/Stock/ListeProduits'
import RapportJournalier from './pages/Rapports/RapportJournalier'
import GestionUtilisateurs from './pages/Admin/GestionUtilisateurs'
import Contacts from './pages/Contacts'
import Dettes from './pages/Dettes'

export default function App() {
  const user = useAuthStore(s => s.user)

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
      <Route path="/ventes/nouvelle" element={<ProtectedRoute roles={['DG', 'GERANT', 'CAISSIER']}><Layout><NouvelleVente /></Layout></ProtectedRoute>} />
      <Route path="/ventes" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><HistoriqueVentes /></Layout></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><ListeProduits /></Layout></ProtectedRoute>} />
      <Route path="/stock/mouvements" element={<Navigate to="/stock" replace />} />
      <Route path="/contacts" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><Contacts /></Layout></ProtectedRoute>} />
      <Route path="/clients" element={<Navigate to="/contacts" replace />} />
      <Route path="/fournisseurs" element={<Navigate to="/contacts" replace />} />
      <Route path="/dettes" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><Dettes /></Layout></ProtectedRoute>} />
      <Route path="/rapports" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><RapportJournalier /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['DG']}><Layout><GestionUtilisateurs /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function Home() {
  const user = useAuthStore(s => s.user)
  if (user?.role === 'CAISSIER') return <Navigate to="/ventes/nouvelle" replace />
  return <Dashboard />
}
