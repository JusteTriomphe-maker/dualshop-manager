import { useCallback, useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function MouvementsStock() {
  const [mouvements, setMouvements] = useState([])
  const [showEntree, setShowEntree] = useState(false)
  const [form, setForm] = useState({ produitId: '', quantite: '', raison: '' })
  const [produits, setProduits] = useState([])
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  const loadData = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    const mouvementsRes = await api.get('/stock/mouvements', { params })
    setMouvements(mouvementsRes.data)
    if (boutiqueId) {
      const produitsRes = await api.get(`/produits?boutiqueId=${boutiqueId}`)
      setProduits(produitsRes.data)
    }
  }, [boutiqueId])

  useEffect(() => {
    loadData().catch(() => {})
  }, [loadData])

  const handleEntree = async (e) => {
    e.preventDefault()
    try {
      await api.post('/stock/entree', {
        produitId: form.produitId,
        quantite: Number(form.quantite),
        raison: form.raison || 'Réapprovisionnement',
        type: 'ENTREE',
      })
      setShowEntree(false)
      setForm({ produitId: '', quantite: '', raison: '' })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mouvements de stock</h1>
          <p className="page-subtitle">Suivi des entrées, sorties et ajustements.</p>
        </div>
        <button onClick={() => setShowEntree(!showEntree)} className="btn btn-success">
          {showEntree ? 'Annuler' : 'Nouvelle entrée'}
        </button>
      </div>

      {showEntree && (
        <form onSubmit={handleEntree} className="panel panel-pad grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="field-label">Produit</label>
            <select value={form.produitId} onChange={e => setForm({ ...form, produitId: e.target.value })} className="select-control" required>
              <option value="">Choisir</option>
              {produits.map(p => (
                <option key={p.id} value={p.id}>{p.nom} (stock: {p.stockActuel})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Quantité</label>
            <input type="number" value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })} className="input-control" required />
          </div>
          <div>
            <label className="field-label">Motif</label>
            <input value={form.raison} onChange={e => setForm({ ...form, raison: e.target.value })} className="input-control" placeholder="Réapprovisionnement" />
          </div>
          <button type="submit" className="btn btn-success">Valider</button>
        </form>
      )}

      <div className="hidden md:block">
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Raison</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map(m => (
                  <tr key={m.id}>
                    <td className="text-slate-500">{new Date(m.createdAt).toLocaleString('fr-FR')}</td>
                    <td className="font-semibold text-slate-950">{m.produit?.nom}</td>
                    <td><TypeBadge type={m.type} /></td>
                    <td className="font-mono font-semibold">{m.quantite}</td>
                    <td className="text-slate-500">{m.raison || '-'}</td>
                  </tr>
                ))}
                {mouvements.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-slate-500">Aucun mouvement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {mouvements.map(m => (
          <article key={m.id} className="mobile-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{m.produit?.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(m.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <TypeBadge type={m.type} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-stone-50 p-3">
              <span className="text-sm text-slate-500">Quantité</span>
              <span className="font-mono font-semibold text-slate-950">{m.quantite}</span>
            </div>
            {m.raison && <p className="mt-3 text-sm text-slate-500">{m.raison}</p>}
          </article>
        ))}
        {mouvements.length === 0 && <div className="empty-state">Aucun mouvement</div>}
      </div>
    </div>
  )
}

function TypeBadge({ type }) {
  if (type === 'ENTREE') return <span className="badge badge-success">Entrée</span>
  if (type === 'SORTIE') return <span className="badge badge-danger">Sortie</span>
  return <span className="badge badge-warning">{type}</span>
}
