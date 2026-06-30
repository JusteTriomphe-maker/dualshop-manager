import { useCallback, useEffect, useState } from 'react'
import api from '../../api/client'

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', password: '', role: 'CAISSIER', boutiqueId: '' })

  const loadUsers = useCallback(async () => {
    const res = await api.get('/users')
    setUsers(res.data)
  }, [])

  useEffect(() => {
    loadUsers().catch(() => {})
  }, [loadUsers])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users', form)
      setShowForm(false)
      setForm({ nom: '', email: '', password: '', role: 'CAISSIER', boutiqueId: '' })
      await loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const toggleActif = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { actif: !user.actif })
      await loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">Comptes, rôles, rattachement boutique et activation.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Annuler' : 'Nouvel utilisateur'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel panel-pad grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="field-label">Nom</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Mot de passe</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Rôle</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="select-control">
              <option value="CAISSIER">Caissier</option>
              <option value="GERANT">Gérant</option>
              <option value="DG">Directeur Général</option>
            </select>
          </div>
          <div>
            <label className="field-label">Boutique</label>
            <select value={form.boutiqueId} onChange={e => setForm({ ...form, boutiqueId: e.target.value })} className="select-control">
              <option value="">Aucune boutique</option>
              <option value="boutique-epicerie">Épicerie</option>
              <option value="boutique-restaubar">Restau-bar</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-success w-full">Créer</button>
          </div>
        </form>
      )}

      <div className="hidden md:block">
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Boutique</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold text-slate-950">{u.nom}</td>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{boutiqueLabel(u.boutiqueId)}</td>
                    <td>{u.actif ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Inactif</span>}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button onClick={() => toggleActif(u)} className="btn btn-secondary btn-sm">
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="7" className="text-center text-slate-500">Aucun utilisateur</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {users.map(u => (
          <article key={u.id} className="mobile-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-950">{u.nom}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{u.email}</p>
              </div>
              {u.actif ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Inactif</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <RoleBadge role={u.role} />
              <span className="badge badge-neutral">{boutiqueLabel(u.boutiqueId)}</span>
            </div>
            <button onClick={() => toggleActif(u)} className="btn btn-secondary btn-sm mt-4">
              {u.actif ? 'Désactiver' : 'Activer'}
            </button>
          </article>
        ))}
        {users.length === 0 && <div className="empty-state">Aucun utilisateur</div>}
      </div>
    </div>
  )
}

function RoleBadge({ role }) {
  if (role === 'DG') return <span className="badge badge-warning">DG</span>
  if (role === 'GERANT') return <span className="badge badge-info">Gérant</span>
  return <span className="badge badge-neutral">Caissier</span>
}

function boutiqueLabel(id) {
  if (id === 'boutique-epicerie') return 'Épicerie'
  if (id === 'boutique-restaubar') return 'Restau-bar'
  return '-'
}
