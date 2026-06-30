import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NouvelleVente from './pages/Ventes/NouvelleVente'
import HistoriqueVentes from './pages/Ventes/HistoriqueVentes'
import ListeProduits from './pages/Stock/ListeProduits'
import MouvementsStock from './pages/Stock/MouvementsStock'
import RapportJournalier from './pages/Rapports/RapportJournalier'
import GestionUtilisateurs from './pages/Admin/GestionUtilisateurs'
import Clients from './pages/Clients'
import Fournisseurs from './pages/Fournisseurs'
import Dettes from './pages/Dettes'

export default function App() {
  const user = useAuthStore(s => s.user)

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/ventes/nouvelle" element={<ProtectedRoute roles={['DG', 'GERANT', 'CAISSIER']}><Layout><NouvelleVente /></Layout></ProtectedRoute>} />
      <Route path="/ventes" element={<ProtectedRoute roles={['DG', 'GERANT', 'CAISSIER']}><Layout><HistoriqueVentes /></Layout></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute roles={['DG', 'GERANT', 'CAISSIER']}><Layout><ListeProduits /></Layout></ProtectedRoute>} />
      <Route path="/stock/mouvements" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><MouvementsStock /></Layout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><Clients /></Layout></ProtectedRoute>} />
      <Route path="/fournisseurs" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><Fournisseurs /></Layout></ProtectedRoute>} />
      <Route path="/dettes" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><Dettes /></Layout></ProtectedRoute>} />
      <Route path="/rapports" element={<ProtectedRoute roles={['DG', 'GERANT']}><Layout><RapportJournalier /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['DG']}><Layout><GestionUtilisateurs /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
