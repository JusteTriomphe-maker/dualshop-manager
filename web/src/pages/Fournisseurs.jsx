import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '', contact: '' })

  const loadFournisseurs = useCallback(async () => {
    const res = await api.get('/fournisseurs')
    setFournisseurs(res.data)
  }, [])

  useEffect(() => {
    loadFournisseurs().catch(() => {})
  }, [loadFournisseurs])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/fournisseurs', form)
      setShowForm(false)
      setForm({ nom: '', telephone: '', contact: '' })
      await loadFournisseurs()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fournisseurs</h1>
          <p className="page-subtitle">Contacts fournisseurs et dettes associées.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Annuler' : 'Nouveau fournisseur'}
        </button>
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
            <label className="field-label">Contact</label>
            <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="input-control" />
          </div>
          <button type="submit" className="btn btn-success md:col-span-3">Créer</button>
        </form>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {fournisseurs.map(f => (
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
        {fournisseurs.length === 0 && <div className="empty-state lg:col-span-2">Aucun fournisseur</div>}
      </div>
    </div>
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
