import { useCallback, useEffect, useState } from 'react'
import api from '../../api/client'

const ROLES = [
  { value: 'CAISSIER', label: 'Caissier',          badge: 'badge-neutral', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
  { value: 'GERANT',   label: 'Gérant',            badge: 'badge-info',    color: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300' },
  { value: 'DG',       label: 'Directeur Général', badge: 'badge-warning', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
]

const BOUTIQUES = [
  { value: '',                    label: 'Aucune boutique' },
  { value: 'boutique-epicerie',   label: 'Épicerie' },
  { value: 'boutique-restaubar',  label: 'Restau-bar' },
]

export default function GestionUtilisateurs() {
  const [users, setUsers]     = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ nom: '', email: '', password: '', role: 'CAISSIER', boutiqueId: '' })

  const loadUsers = useCallback(async () => {
    const res = await api.get('/users')
    setUsers(res.data)
  }, [])

  useEffect(() => { loadUsers().catch(() => {}) }, [loadUsers])

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

  const activeCount   = users.filter(u => u.actif).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Comptes, rôles, boutiques rattachées et statut d'activation.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn gap-2 ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        >
          {showForm ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Annuler
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouvel utilisateur
            </>
          )}
        </button>
      </div>

      {/* ── Stats summary ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-teal-500" />
          <div className="pl-3">
            <p className="stat-label">Total</p>
            <p className="stat-value">{users.length}</p>
            <p className="stat-meta">utilisateur(s)</p>
          </div>
        </div>
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-emerald-500" />
          <div className="pl-3">
            <p className="stat-label">Actifs</p>
            <p className="stat-value text-emerald-600 dark:text-emerald-400">{activeCount}</p>
            <p className="stat-meta">comptes actifs</p>
          </div>
        </div>
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-rose-500" />
          <div className="pl-3">
            <p className="stat-label">Inactifs</p>
            <p className="stat-value text-rose-600 dark:text-rose-400">{inactiveCount}</p>
            <p className="stat-meta">comptes désactivés</p>
          </div>
        </div>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <form onSubmit={handleCreate} className="panel panel-pad">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 text-white text-sm">+</span>
            Créer un compte utilisateur
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="field-label">Nom complet *</label>
              <input
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="input-control"
                required
                placeholder="Prénom Nom"
              />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-control"
                required
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="field-label">Mot de passe *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-control"
                required
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="field-label">Rôle</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="select-control">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Boutique rattachée</label>
              <select value={form.boutiqueId} onChange={e => setForm({ ...form, boutiqueId: e.target.value })} className="select-control">
                {BOUTIQUES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn btn-success w-full gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Créer le compte
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Desktop table ── */}
      <div className="hidden md:block">
        <div className="table-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <span>👥</span>
            <h2 className="font-semibold">Liste des comptes</h2>
            <span className="ml-auto text-sm text-slate-400">{users.length} compte(s)</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
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
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          u.role === 'DG' ? 'bg-amber-500' : u.role === 'GERANT' ? 'bg-sky-500' : 'bg-slate-500'
                        }`}>
                          {u.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{u.nom}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {boutiqueLabel(u.boutiqueId)}
                      </span>
                    </td>
                    <td>
                      {u.actif
                        ? <span className="badge badge-success">Actif</span>
                        : <span className="badge badge-danger">Inactif</span>
                      }
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActif(u)}
                        className={`btn btn-sm gap-1.5 ${u.actif ? 'btn-danger' : 'btn-success'}`}
                      >
                        {u.actif ? '🔒 Désactiver' : '🔓 Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">Aucun utilisateur enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="grid gap-3 md:hidden">
        {users.length === 0 && <div className="empty-state">Aucun utilisateur.</div>}
        {users.map(u => (
          <article key={u.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  u.role === 'DG' ? 'bg-amber-500' : u.role === 'GERANT' ? 'bg-sky-500' : 'bg-slate-500'
                }`}>
                  {u.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900 dark:text-white">{u.nom}</h2>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                </div>
              </div>
              {u.actif ? <span className="badge badge-success shrink-0">Actif</span> : <span className="badge badge-danger shrink-0">Inactif</span>}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <RoleBadge role={u.role} />
              <span className="badge badge-neutral">{boutiqueLabel(u.boutiqueId)}</span>
              <span className="badge badge-neutral text-xs">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>

            <button
              onClick={() => toggleActif(u)}
              className={`btn btn-sm mt-3 gap-1.5 ${u.actif ? 'btn-danger' : 'btn-success'}`}
            >
              {u.actif ? '🔒 Désactiver' : '🔓 Activer'}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

function RoleBadge({ role }) {
  const r = ROLES.find(r => r.value === role) || { label: role, badge: 'badge-neutral' }
  return <span className={`badge ${r.badge}`}>{r.label}</span>
}

function boutiqueLabel(id) {
  return BOUTIQUES.find(b => b.value === id)?.label || '—'
}
