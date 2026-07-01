import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Contacts() {
  const [tab, setTab] = useState('clients')
  const [clients, setClients] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [clientForm, setClientForm] = useState({ nom: '', telephone: '', adresse: '' })
  const [fournisseurForm, setFournisseurForm] = useState({ nom: '', telephone: '', contact: '' })
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

  useEffect(() => {
    loadClients().catch(() => {})
  }, [loadClients])

  useEffect(() => {
    loadFournisseurs().catch(() => {})
  }, [loadFournisseurs])

  const filteredFournisseurs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return fournisseurs
    return fournisseurs.filter(f =>
      [f.nom, f.telephone, f.contact].filter(Boolean).some(value => value.toLowerCase().includes(q))
    )
  }, [fournisseurs, search])

  const activeCount = tab === 'clients' ? clients.length : filteredFournisseurs.length

  const switchTab = (nextTab) => {
    setTab(nextTab)
    setShowForm(false)
    setSearch('')
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    try {
      await api.post('/clients', { ...clientForm, boutiqueId })
      setShowForm(false)
      setClientForm({ nom: '', telephone: '', adresse: '' })
      await loadClients()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const handleCreateFournisseur = async (e) => {
    e.preventDefault()
    try {
      await api.post('/fournisseurs', fournisseurForm)
      setShowForm(false)
      setFournisseurForm({ nom: '', telephone: '', contact: '' })
      await loadFournisseurs()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Clients et fournisseurs dans un seul écran, avec leurs ventes, crédits et dettes.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Annuler' : tab === 'clients' ? 'Nouveau client' : 'Nouveau fournisseur'}
        </button>
      </div>

      <div className="panel p-1">
        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => switchTab('clients')} className={`btn ${tab === 'clients' ? 'btn-primary' : 'btn-ghost'}`}>
            Clients ({clients.length})
          </button>
          <button onClick={() => switchTab('fournisseurs')} className={`btn ${tab === 'fournisseurs' ? 'btn-primary' : 'btn-ghost'}`}>
            Fournisseurs ({fournisseurs.length})
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="w-full sm:max-w-md">
          <label className="field-label">Recherche</label>
          <input
            type="text"
            placeholder={tab === 'clients' ? 'Nom ou téléphone client' : 'Nom, téléphone ou contact fournisseur'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-control"
          />
        </div>
        <div className="stat-card w-full sm:w-56">
          <p className="stat-label">Résultat</p>
          <p className="stat-value">{activeCount}</p>
          <p className="stat-meta">{tab === 'clients' ? 'client(s)' : 'fournisseur(s)'}</p>
        </div>
      </div>

      {showForm && tab === 'clients' && (
        <form onSubmit={handleCreateClient} className="panel panel-pad grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">Nom</label>
            <input value={clientForm.nom} onChange={e => setClientForm({ ...clientForm, nom: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Téléphone</label>
            <input value={clientForm.telephone} onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })} className="input-control" />
          </div>
          <div>
            <label className="field-label">Adresse</label>
            <input value={clientForm.adresse} onChange={e => setClientForm({ ...clientForm, adresse: e.target.value })} className="input-control" />
          </div>
          <button type="submit" className="btn btn-success md:col-span-3">Créer le client</button>
        </form>
      )}

      {showForm && tab === 'fournisseurs' && (
        <form onSubmit={handleCreateFournisseur} className="panel panel-pad grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">Nom</label>
            <input value={fournisseurForm.nom} onChange={e => setFournisseurForm({ ...fournisseurForm, nom: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Téléphone</label>
            <input value={fournisseurForm.telephone} onChange={e => setFournisseurForm({ ...fournisseurForm, telephone: e.target.value })} className="input-control" />
          </div>
          <div>
            <label className="field-label">Contact</label>
            <input value={fournisseurForm.contact} onChange={e => setFournisseurForm({ ...fournisseurForm, contact: e.target.value })} className="input-control" />
          </div>
          <button type="submit" className="btn btn-success md:col-span-3">Créer le fournisseur</button>
        </form>
      )}

      {tab === 'clients' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {clients.map(c => (
            <article key={c.id} className="mobile-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-950">{c.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">{c.telephone || 'Pas de téléphone'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="badge badge-neutral">{c._count?.dettes || 0} dette(s)</span>
                  <span className="badge badge-info">{c._count?.ventes || 0} vente(s)</span>
                </div>
              </div>
              <ClientDetailModal clientId={c.id} />
            </article>
          ))}
          {clients.length === 0 && <div className="empty-state lg:col-span-2">Aucun client</div>}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredFournisseurs.map(f => (
            <article key={f.id} className="mobile-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-950">{f.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">{f.telephone || 'Pas de téléphone'}{f.contact ? ` · ${f.contact}` : ''}</p>
                <div className="mt-3">
                  <span className="badge badge-warning">{f._count?.dettes || 0} dette(s)</span>
                </div>
              </div>
              <FournisseurDetailModal fournisseurId={f.id} />
            </article>
          ))}
          {filteredFournisseurs.length === 0 && <div className="empty-state lg:col-span-2">Aucun fournisseur</div>}
        </div>
      )}
    </div>
  )
}

function ClientDetailModal({ clientId }) {
  const [open, setOpen] = useState(false)
  const [client, setClient] = useState(null)

  useEffect(() => {
    if (open && clientId) {
      api.get(`/clients/${clientId}`).then(res => setClient(res.data)).catch(() => {})
    }
  }, [open, clientId])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">Détails</button>
      {open && client && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{client.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">Tél: {client.telephone || '-'} · Adresse: {client.adresse || '-'}</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Fermer</button>
            </div>
            <div className="mt-5 rounded-lg bg-rose-50 p-4">
              <p className="stat-label text-rose-700">Total impayé</p>
              <p className="mt-1 text-2xl font-semibold text-rose-700">{client.totalDues?.toLocaleString('fr-FR')} F</p>
            </div>
            <h3 className="mt-5 font-semibold text-slate-950">Dettes</h3>
            <div className="mt-3 space-y-3">
              {client.dettes?.map(d => (
                <div key={d.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <DebtBadge statut={d.statut} />
                    <span className="font-semibold text-slate-950">{d.montantRestant.toLocaleString('fr-FR')} / {d.montant.toLocaleString('fr-FR')} F</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{d.description || d.vente?.numero || ''}</p>
                  {d.paiements?.map(p => (
                    <p key={p.id} className="mt-1 text-xs font-medium text-emerald-700">Paiement: {p.montant.toLocaleString('fr-FR')} F le {new Date(p.datePaiement).toLocaleDateString('fr-FR')}</p>
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

function FournisseurDetailModal({ fournisseurId }) {
  const [open, setOpen] = useState(false)
  const [fournisseur, setFournisseur] = useState(null)

  useEffect(() => {
    if (open && fournisseurId) {
      api.get(`/fournisseurs/${fournisseurId}`).then(res => setFournisseur(res.data)).catch(() => {})
    }
  }, [open, fournisseurId])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">Détails</button>
      {open && fournisseur && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{fournisseur.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">{fournisseur.telephone || 'Pas de téléphone'}</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Fermer</button>
            </div>
            <div className="mt-5 rounded-lg bg-amber-50 p-4">
              <p className="stat-label text-amber-700">Total dû</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{fournisseur.totalDu?.toLocaleString('fr-FR')} F</p>
            </div>
            <h3 className="mt-5 font-semibold text-slate-950">Dettes</h3>
            <div className="mt-3 space-y-3">
              {fournisseur.dettes?.map(d => (
                <div key={d.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <DebtBadge statut={d.statut} />
                    <span className="font-semibold text-slate-950">Dû: {(d.montantDu - d.montantPaye).toLocaleString('fr-FR')} F</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{d.description || d.produit?.nom || ''}</p>
                  {d.paiements?.map(p => (
                    <p key={p.id} className="mt-1 text-xs font-medium text-emerald-700">Payé: {p.montant.toLocaleString('fr-FR')} F le {new Date(p.datePaiement).toLocaleDateString('fr-FR')}</p>
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
  if (statut === 'PAYEE') return <span className="badge badge-success">Payée</span>
  if (statut === 'PARTIELLE') return <span className="badge badge-warning">Partielle</span>
  return <span className="badge badge-danger">Impayée</span>
}
