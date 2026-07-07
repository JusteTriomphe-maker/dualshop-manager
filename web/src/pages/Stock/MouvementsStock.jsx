import { useCallback, useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function MouvementsStock() {
  const [mouvements, setMouvements]   = useState([])
  const [showEntree, setShowEntree]   = useState(false)
  const [form, setForm]               = useState({ produitId: '', quantite: '', coutAchat: '', raison: '', fournisseurId: '', creerDette: false })
  const [produits, setProduits]       = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  const loadData = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    const mouvementsRes = await api.get('/stock/mouvements', { params })
    setMouvements(mouvementsRes.data)
    
    const fournisseursRes = await api.get('/fournisseurs')
    setFournisseurs(fournisseursRes.data)

    if (boutiqueId) {
      const produitsRes = await api.get(`/produits?boutiqueId=${boutiqueId}`)
      setProduits(produitsRes.data)
    }
  }, [boutiqueId])

  useEffect(() => { loadData().catch(() => {}) }, [loadData])

  const handleEntree = async (e) => {
    e.preventDefault()
    try {
      await api.post('/stock/entree', {
        produitId:     form.produitId,
        quantite:      Number(form.quantite),
        coutAchat:     form.coutAchat === '' ? undefined : Number(form.coutAchat),
        raison:        form.raison || 'Réapprovisionnement',
        type:          'ENTREE',
        fournisseurId: form.fournisseurId || undefined,
        creerDette:    form.creerDette,
      })
      setShowEntree(false)
      setForm({ produitId: '', quantite: '', coutAchat: '', raison: '', fournisseurId: '', creerDette: false })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const entrees = mouvements.filter(m => m.type === 'ENTREE').length
  const sorties = mouvements.filter(m => m.type === 'SORTIE').length

  const actifs = produits.filter(p => p.actif)

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mouvements de stock</h1>
          <p className="page-subtitle">Suivi des entrées, sorties et ajustements de marchandises.</p>
        </div>
        <button
          onClick={() => setShowEntree(!showEntree)}
          className={`btn gap-2 ${showEntree ? 'btn-secondary' : 'btn-success'}`}
        >
          {showEntree ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Annuler
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Nouvelle entrée
            </>
          )}
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-slate-600" />
          <div className="pl-3">
            <p className="stat-label">Total mouvements</p>
            <p className="stat-value">{mouvements.length}</p>
            <p className="stat-meta">enregistrés</p>
          </div>
        </div>
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-emerald-500" />
          <div className="pl-3">
            <p className="stat-label">Entrées ⬇</p>
            <p className="stat-value text-emerald-600 dark:text-emerald-400">{entrees}</p>
            <p className="stat-meta">réapprovisionnements</p>
          </div>
        </div>
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-rose-500" />
          <div className="pl-3">
            <p className="stat-label">Sorties ⬆</p>
            <p className="stat-value text-rose-600 dark:text-rose-400">{sorties}</p>
            <p className="stat-meta">ventes & ajustements</p>
          </div>
        </div>
      </div>

      {/* ── New entry form ── */}
      {showEntree && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-4 text-white">
            <h2 className="font-semibold">Nouvelle entrée en stock</h2>
            <p className="text-sm text-slate-400">Enregistrez les marchandises reçues.</p>
          </div>
          <form onSubmit={handleEntree} className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-[minmax(0,2fr)_8rem_10rem_minmax(0,1.5fr)_minmax(0,1.5fr)]">
              <div>
                <label className="field-label">Produit *</label>
                <select
                  value={form.produitId}
                  onChange={e => setForm({ ...form, produitId: e.target.value })}
                  className="select-control"
                  required
                >
                  <option value="">Choisir un produit…</option>
                  {actifs.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (stock: {p.stockActuel})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Quantité *</label>
                <input
                  type="number" min="1"
                  value={form.quantite}
                  onChange={e => setForm({ ...form, quantite: e.target.value })}
                  className="input-control"
                  required
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="field-label">Coût d'achat (Unitaire)</label>
                <input
                  type="number" min="0"
                  value={form.coutAchat}
                  onChange={e => setForm({ ...form, coutAchat: e.target.value })}
                  className="input-control"
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="field-label">Fournisseur</label>
                <select
                  value={form.fournisseurId}
                  onChange={e => setForm({ ...form, fournisseurId: e.target.value })}
                  className="select-control"
                >
                  <option value="">Aucun fournisseur</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Motif</label>
                <input
                  value={form.raison}
                  onChange={e => setForm({ ...form, raison: e.target.value })}
                  className="input-control"
                  placeholder="Réapprovisionnement"
                />
              </div>
            </div>

            {form.fournisseurId && form.coutAchat && (
              <div className="flex items-center gap-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20 p-3">
                <input
                  type="checkbox"
                  id="creerDette"
                  checked={form.creerDette}
                  onChange={e => setForm({ ...form, creerDette: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="creerDette" className="text-sm font-medium text-teal-900 dark:text-teal-300 cursor-pointer">
                  Créer automatiquement une dette fournisseur de <strong>{(Number(form.quantite || 0) * Number(form.coutAchat || 0)).toLocaleString('fr-FR')} F</strong> pour ce fournisseur.
                </label>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowEntree(false)} className="btn btn-secondary">Annuler</button>
              <button type="submit" className="btn btn-success gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Valider
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Desktop table ── */}
      <div className="hidden md:block">
        <div className="table-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <span>🕒</span>
            <h2 className="font-semibold">Historique des mouvements</h2>
            <span className="ml-auto text-sm text-slate-400">{mouvements.length} entrée(s)</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Fournisseur</th>
                  <th>Type</th>
                  <th className="text-right">Quantité</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map(m => (
                  <tr key={m.id}>
                    <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-white">{m.produit?.nom}</td>
                    <td className="text-slate-600 dark:text-slate-300 font-medium">{m.fournisseur?.nom || '—'}</td>
                    <td><TypeBadge type={m.type} /></td>
                    <td className="text-right">
                      <span className={`font-mono font-bold text-base ${
                        m.type === 'ENTREE'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
                      </span>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">{m.raison || '—'}</td>
                  </tr>
                ))}
                {mouvements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">Aucun mouvement enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="grid gap-3 md:hidden">
        {mouvements.map(m => (
          <article key={m.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 dark:text-white">{m.produit?.nom}</h2>
                <p className="mt-0.5 text-xs text-slate-400">{new Date(m.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <TypeBadge type={m.type} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Quantité</span>
              <span className={`font-mono text-xl font-bold ${
                m.type === 'ENTREE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
              </span>
            </div>
            {m.fournisseur?.nom && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                🏢 Fournisseur: <span className="text-teal-700 dark:text-teal-400">{m.fournisseur.nom}</span>
              </p>
            )}
            {m.raison && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">📝 {m.raison}</p>
            )}
          </article>
        ))}
        {mouvements.length === 0 && <div className="empty-state">Aucun mouvement enregistré.</div>}
      </div>
    </div>
  )
}

function TypeBadge({ type }) {
  if (type === 'ENTREE') return <span className="badge badge-success">⬇ Entrée</span>
  if (type === 'SORTIE') return <span className="badge badge-danger">⬆ Sortie</span>
  return <span className="badge badge-warning">{type}</span>
}
