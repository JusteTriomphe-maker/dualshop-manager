import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '' })
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  const loadClients = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    if (search) params.search = search
    const res = await api.get('/clients', { params })
    setClients(res.data)
  }, [boutiqueId, search])

  useEffect(() => {
    loadClients().catch(() => {})
  }, [loadClients])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/clients', { ...form, boutiqueId })
      setShowForm(false)
      setForm({ nom: '', telephone: '', adresse: '' })
      await loadClients()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Contacts, ventes associées et suivi des impayés.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Annuler' : 'Nouveau client'}
        </button>
      </div>

      <div className="toolbar">
        <div className="w-full sm:max-w-md">
          <label className="field-label">Recherche</label>
          <input type="text" placeholder="Nom ou téléphone" value={search} onChange={e => setSearch(e.target.value)} className="input-control" />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel panel-pad grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">Nom</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Téléphone</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="input-control" />
          </div>
          <div>
            <label className="field-label">Adresse</label>
            <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="input-control" />
          </div>
          <button type="submit" className="btn btn-success md:col-span-3">Créer</button>
        </form>
      )}

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

function DebtBadge({ statut }) {
  if (statut === 'PAYEE') return <span className="badge badge-success">Payée</span>
  if (statut === 'PARTIELLE') return <span className="badge badge-warning">Partielle</span>
  return <span className="badge badge-danger">Impayée</span>
}
