import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Contacts() {
  const [tab, setTab]                           = useState('clients')
  const [clients, setClients]                   = useState([])
  const [fournisseurs, setFournisseurs]         = useState([])
  const [search, setSearch]                     = useState('')
  const [showForm, setShowForm]                 = useState(false)
  const [clientForm, setClientForm]             = useState({ nom: '', telephone: '', adresse: '' })
  const [fournisseurForm, setFournisseurForm]   = useState({ nom: '', telephone: '', contact: '' })
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  const loadClients = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    if (search && tab === 'clients') params.search = search
    const res = await api.get('/clients', { params })
    setClients(res.data)
  }, [boutiqueId, search, tab])

  const loadFournisseurs = useCallback(async () => {
    const res = await api.get('/fournisseurs')
    setFournisseurs(res.data)
  }, [])

  useEffect(() => { loadClients().catch(() => {}) }, [loadClients])
  useEffect(() => { loadFournisseurs().catch(() => {}) }, [loadFournisseurs])

  const filteredFournisseurs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return fournisseurs
    return fournisseurs.filter(f =>
      [f.nom, f.telephone, f.contact].filter(Boolean).some(v => v.toLowerCase().includes(q))
    )
  }, [fournisseurs, search])

  const switchTab = (next) => { setTab(next); setShowForm(false); setSearch('') }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    try {
      await api.post('/clients', { ...clientForm, boutiqueId })
      setShowForm(false)
      setClientForm({ nom: '', telephone: '', adresse: '' })
      await loadClients()
    } catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const handleCreateFournisseur = async (e) => {
    e.preventDefault()
    try {
      await api.post('/fournisseurs', fournisseurForm)
      setShowForm(false)
      setFournisseurForm({ nom: '', telephone: '', contact: '' })
      await loadFournisseurs()
    } catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const activeList = tab === 'clients' ? clients : filteredFournisseurs

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Clients et fournisseurs — ventes, crédits et dettes dans un seul écran.</p>
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
              {tab === 'clients' ? 'Nouveau client' : 'Nouveau fournisseur'}
            </>
          )}
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-1">
        {[
          { key: 'clients',      label: 'Clients',       count: clients.length,              icon: '👤' },
          { key: 'fournisseurs', label: 'Fournisseurs',  count: filteredFournisseurs.length, icon: '🏭' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              tab === t.key ? 'text-teal-600' : 'text-slate-400'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="relative w-full sm:max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={tab === 'clients' ? 'Nom ou téléphone…' : 'Nom, téléphone ou contact…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-control pl-9"
          />
        </div>
        <div className="stat-card py-2 px-4 w-full sm:w-auto text-center sm:text-right shrink-0">
          <p className="stat-label">Résultats</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{activeList.length}</p>
          <p className="stat-meta">{tab === 'clients' ? 'client(s)' : 'fournisseur(s)'}</p>
        </div>
      </div>

      {/* ── New record form ── */}
      {showForm && tab === 'clients' && (
        <form onSubmit={handleCreateClient} className="panel panel-pad">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>👤</span> Nouveau client
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="field-label">Nom *</label>
              <input value={clientForm.nom} onChange={e => setClientForm({ ...clientForm, nom: e.target.value })} className="input-control" required placeholder="Nom complet" />
            </div>
            <div>
              <label className="field-label">Téléphone</label>
              <input value={clientForm.telephone} onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })} className="input-control" placeholder="Ex: 06xxxxxxxx" />
            </div>
            <div>
              <label className="field-label">Adresse</label>
              <input value={clientForm.adresse} onChange={e => setClientForm({ ...clientForm, adresse: e.target.value })} className="input-control" placeholder="Quartier, ville…" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button>
            <button type="submit" className="btn btn-success gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Créer le client
            </button>
          </div>
        </form>
      )}

      {showForm && tab === 'fournisseurs' && (
        <form onSubmit={handleCreateFournisseur} className="panel panel-pad">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏭</span> Nouveau fournisseur
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="field-label">Nom *</label>
              <input value={fournisseurForm.nom} onChange={e => setFournisseurForm({ ...fournisseurForm, nom: e.target.value })} className="input-control" required placeholder="Nom de la société" />
            </div>
            <div>
              <label className="field-label">Téléphone</label>
              <input value={fournisseurForm.telephone} onChange={e => setFournisseurForm({ ...fournisseurForm, telephone: e.target.value })} className="input-control" placeholder="Ex: 06xxxxxxxx" />
            </div>
            <div>
              <label className="field-label">Personne de contact</label>
              <input value={fournisseurForm.contact} onChange={e => setFournisseurForm({ ...fournisseurForm, contact: e.target.value })} className="input-control" placeholder="Nom du contact" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button>
            <button type="submit" className="btn btn-success gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Créer le fournisseur
            </button>
          </div>
        </form>
      )}

      {/* ── Contact list ── */}
      <div className="grid gap-3 lg:grid-cols-2">
        {activeList.length === 0 && (
          <div className="empty-state lg:col-span-2">
            <p className="text-3xl mb-2">{tab === 'clients' ? '👤' : '🏭'}</p>
            Aucun {tab === 'clients' ? 'client' : 'fournisseur'} trouvé.
          </div>
        )}
        {tab === 'clients'
          ? clients.map(c => (
              <article key={c.id} className="panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-sm">
                    {c.nom?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900 dark:text-white">{c.nom}</h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {c.telephone || 'Pas de téléphone'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge badge-neutral">{c._count?.dettes || 0} dette(s)</span>
                      <span className="badge badge-info">{c._count?.ventes || 0} vente(s)</span>
                    </div>
                  </div>
                </div>
                <ClientDetailModal clientId={c.id} />
              </article>
            ))
          : filteredFournisseurs.map(f => (
              <article key={f.id} className="panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    {f.nom?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900 dark:text-white">{f.nom}</h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {f.telephone || 'Pas de téléphone'}{f.contact ? ` · ${f.contact}` : ''}
                    </p>
                    <div className="mt-2">
                      <span className="badge badge-warning">{f._count?.dettes || 0} dette(s)</span>
                    </div>
                  </div>
                </div>
                <FournisseurDetailModal fournisseurId={f.id} />
              </article>
            ))
        }
      </div>
    </div>
  )
}

/* ── Client detail modal ── */
function ClientDetailModal({ clientId }) {
  const [open, setOpen]     = useState(false)
  const [client, setClient] = useState(null)

  useEffect(() => {
    if (open && clientId)
      api.get(`/clients/${clientId}`).then(r => setClient(r.data)).catch(() => {})
  }, [open, clientId])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm shrink-0">Détails</button>
      {open && client && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-lg font-bold">
                  {client.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{client.nom}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    📞 {client.telephone || '—'} · 📍 {client.adresse || '—'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Total */}
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 mb-4">
              <p className="stat-label text-rose-700 dark:text-rose-400">Total impayé</p>
              <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400">
                {client.totalDues?.toLocaleString('fr-FR')} F
              </p>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Historique des dettes</h3>
            <div className="space-y-3">
              {client.dettes?.map(d => (
                <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <DebtBadge statut={d.statut} />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.montantRestant.toLocaleString('fr-FR')} / {d.montant.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{d.description || d.vente?.numero || '—'}</p>
                  {d.paiements?.map(p => (
                    <p key={p.id} className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Paiement {p.montant.toLocaleString('fr-FR')} F le {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                    </p>
                  ))}
                </div>
              ))}
              {client.dettes?.length === 0 && <div className="empty-state">Aucune dette</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Fournisseur detail modal ── */
function FournisseurDetailModal({ fournisseurId }) {
  const [open, setOpen]               = useState(false)
  const [fournisseur, setFournisseur] = useState(null)

  useEffect(() => {
    if (open && fournisseurId)
      api.get(`/fournisseurs/${fournisseurId}`).then(r => setFournisseur(r.data)).catch(() => {})
  }, [open, fournisseurId])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm shrink-0">Détails</button>
      {open && fournisseur && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-lg font-bold">
                  {fournisseur.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{fournisseur.nom}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    📞 {fournisseur.telephone || '—'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 mb-4">
              <p className="stat-label text-amber-700 dark:text-amber-400">Total dû</p>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                {fournisseur.totalDu?.toLocaleString('fr-FR')} F
              </p>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Dettes fournisseur</h3>
            <div className="space-y-3">
              {fournisseur.dettes?.map(d => (
                <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <DebtBadge statut={d.statut} />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Dû: {(d.montantDu - d.montantPaye).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{d.description || d.produit?.nom || '—'}</p>
                  {d.paiements?.map(p => (
                    <p key={p.id} className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Payé {p.montant.toLocaleString('fr-FR')} F le {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                    </p>
                  ))}
                </div>
              ))}
              {fournisseur.dettes?.length === 0 && <div className="empty-state">Aucune dette</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DebtBadge({ statut }) {
  if (statut === 'PAYEE')    return <span className="badge badge-success">Payée</span>
  if (statut === 'PARTIELLE') return <span className="badge badge-warning">Partielle</span>
  return <span className="badge badge-danger">Impayée</span>
}
