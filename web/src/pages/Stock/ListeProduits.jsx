import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

const emptyProductForm = { nom: '', prix: '', coutAchat: '', stockActuel: 0, stockMin: 5, categorie: '' }
const emptyEntreeForm  = { produitId: '', quantite: '', coutAchat: '', raison: '', fournisseurId: '', creerDette: false }

const TABS = [
  { key: 'catalogue',  label: 'Catalogue',       icon: '📦' },
  { key: 'entree',     label: 'Entrée en stock',  icon: '⬇️' },
  { key: 'historique', label: 'Historique',       icon: '🕒' },
]

export default function ListeProduits() {
  const [produits, setProduits]     = useState([])
  const [mouvements, setMouvements] = useState([])
  const [activeTab, setActiveTab]   = useState('catalogue')
  const [search, setSearch]         = useState('')
  const [filterCateg, setFilterCateg] = useState('Tous')
  const [showForm, setShowForm]     = useState(false)
  const [editProduit, setEditProduit] = useState(null)
  const [form, setForm]             = useState(emptyProductForm)
  const [entreeForm, setEntreeForm] = useState(emptyEntreeForm)
  const [fournisseurs, setFournisseurs] = useState([])

  const user       = useAuthStore(s => s.user)
  const boutiqueId = useAuthStore(s => s.boutiqueId)
  const canEdit    = user?.role === 'DG' || user?.role === 'GERANT'

  const loadData = useCallback(async () => {
    const produitParams = {}
    if (boutiqueId) produitParams.boutiqueId = boutiqueId
    if (canEdit) produitParams.inclusInactifs = 'true'
    const produitsRes = await api.get('/produits', { params: produitParams })
    setProduits(produitsRes.data)
    const fournisseursRes = await api.get('/fournisseurs')
    setFournisseurs(fournisseursRes.data)
    if (boutiqueId) {
      const mouvementsRes = await api.get('/stock/mouvements', { params: { boutiqueId } })
      setMouvements(mouvementsRes.data)
    } else {
      setMouvements([])
    }
  }, [boutiqueId, canEdit])

  useEffect(() => { loadData().catch(() => {}) }, [loadData])

  const actifs     = produits.filter(p => p.actif)
  const stockBas   = actifs.filter(p => p.stockActuel <= p.stockMin).length
  const valeurVente = actifs.reduce((sum, p) => sum + (p.stockActuel * p.prix), 0)

  const categories = ['Tous', ...new Set(actifs.map(p => p.categorie).filter(Boolean))]

  const filteredProduits = useMemo(() => {
    const q = search.trim().toLowerCase()
    return produits.filter(p => {
      const matchQ = !q || [p.nom, p.code, p.categorie].filter(Boolean).some(v => v.toLowerCase().includes(q))
      const matchC = filterCateg === 'Tous' || p.categorie === filterCateg
      return matchQ && matchC
    })
  }, [produits, search, filterCateg])

  const resetForm = () => setForm(emptyProductForm)

  const payloadFromForm = src => ({
    nom: src.nom, boutiqueId,
    prix: Number(src.prix),
    coutAchat: src.coutAchat === '' ? undefined : Number(src.coutAchat),
    stockActuel: Number(src.stockActuel || 0),
    stockMin: Number(src.stockMin || 0),
    categorie: src.categorie,
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try { await api.post('/produits', payloadFromForm(form)); setShowForm(false); resetForm(); await loadData() }
    catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/produits/${editProduit.id}`, {
        nom: form.nom, prix: Number(form.prix),
        coutAchat: form.coutAchat === '' ? undefined : Number(form.coutAchat),
        stockMin: Number(form.stockMin), categorie: form.categorie,
      })
      setEditProduit(null); resetForm(); await loadData()
    } catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const handleEntree = async (e) => {
    e.preventDefault()
    try {
      await api.post('/stock/entree', {
        produitId:     entreeForm.produitId,
        quantite:      Number(entreeForm.quantite),
        coutAchat:     entreeForm.coutAchat === '' ? undefined : Number(entreeForm.coutAchat),
        raison:        entreeForm.raison || 'Réapprovisionnement',
        type:          'ENTREE',
        fournisseurId: entreeForm.fournisseurId || undefined,
        creerDette:    entreeForm.creerDette,
      })
      setEntreeForm(emptyEntreeForm); await loadData(); setActiveTab('catalogue')
    } catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const openEdit = (p) => {
    setActiveTab('catalogue'); setShowForm(false); setEditProduit(p)
    setForm({
      nom: p.nom, prix: String(p.prix),
      coutAchat: p.coutAchat == null ? '' : String(p.coutAchat),
      stockActuel: p.stockActuel, stockMin: p.stockMin, categorie: p.categorie || '',
    })
  }

  const startCreate = () => { setActiveTab('catalogue'); setShowForm(true); setEditProduit(null); resetForm() }

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer définitivement "${p.nom}" ?\n\nSi le produit a déjà été vendu, il sera archivé.`)) return
    try { const res = await api.delete(`/produits/${p.id}`); alert(res.data.message); await loadData() }
    catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  const toggleActif = async (p) => {
    try { await api.put(`/produits/${p.id}`, { actif: !p.actif }); await loadData() }
    catch (err) { alert(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock</h1>
          <p className="page-subtitle">Produits, marchandises, réapprovisionnements et historique des mouvements.</p>
        </div>
        {canEdit && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button onClick={startCreate} className="btn btn-primary gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouveau produit
            </button>
            <button onClick={() => setActiveTab('entree')} className="btn btn-success gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Entrée en stock
            </button>
          </div>
        )}
      </div>

      {!boutiqueId && <div className="empty-state">Sélectionnez une boutique avant de gérer le stock.</div>}

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-slate-700 dark:bg-slate-400" />
          <div className="pl-3">
            <p className="stat-label">Produits actifs</p>
            <p className="stat-value">{actifs.length}</p>
            <p className="stat-meta">{produits.length - actifs.length} archivé(s)</p>
          </div>
        </div>

        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-amber-500" />
          <div className="pl-3">
            <p className="stat-label">Stock bas ⚠️</p>
            <p className={`stat-value ${stockBas > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{stockBas}</p>
            <p className="stat-meta">produit(s) à réapprovisionner</p>
          </div>
        </div>

        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-teal-600" />
          <div className="pl-3">
            <p className="stat-label">Valeur stock vente</p>
            <p className="stat-value text-teal-700 dark:text-teal-400">{valeurVente.toLocaleString('fr-FR')} <span className="text-base font-medium">F</span></p>
            <p className="stat-meta">selon prix de vente</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === t.key
                ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="hidden sm:inline">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════ CATALOGUE ══════════════════════ */}
      {activeTab === 'catalogue' && (
        <>
          {/* Toolbar */}
          <div className="toolbar">
            <div className="relative w-full sm:max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Nom, code ou catégorie…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-control pl-9"
              />
            </div>
            {/* Category pills */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilterCateg(c)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      filterCateg === c
                        ? 'bg-teal-700 text-white shadow'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stock bas alert */}
          {stockBas > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {stockBas} produit(s) en stock bas — pensez à réapprovisionner.
              </p>
              <button
                onClick={() => setActiveTab('entree')}
                className="ml-auto btn btn-sm gap-1 border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
              >
                Entrée en stock →
              </button>
            </div>
          )}

          {/* Create form */}
          {showForm && !editProduit && (
            <ProductForm
              title="Nouveau produit"
              form={form} setForm={setForm}
              onSubmit={handleCreate} submitLabel="Créer le produit"
              allowInitialStock
              onCancel={() => { setShowForm(false); resetForm() }}
            />
          )}

          {/* Edit form */}
          {editProduit && (
            <ProductForm
              title={`Modifier : ${editProduit.nom}`}
              form={form} setForm={setForm}
              onSubmit={handleEdit} submitLabel="Enregistrer"
              onCancel={() => { setEditProduit(null); resetForm() }}
            />
          )}

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="table-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
                <span>📦</span>
                <h2 className="font-semibold">Catalogue produits</h2>
                <span className="ml-auto text-sm text-slate-400">{filteredProduits.length} produit(s)</span>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th className="text-right">Prix vente</th>
                      <th className="text-right">Coût achat</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Min</th>
                      <th>Statut</th>
                      {canEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProduits.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{p.nom}</p>
                            {p.code && <p className="text-xs text-slate-400 font-mono">{p.code}</p>}
                          </div>
                        </td>
                        <td>
                          {p.categorie
                            ? <span className="badge badge-neutral">{p.categorie}</span>
                            : <span className="text-slate-400">—</span>
                          }
                        </td>
                        <td className="text-right font-semibold text-slate-900 dark:text-white">
                          {p.prix.toLocaleString('fr-FR')} F
                        </td>
                        <td className="text-right text-slate-500 dark:text-slate-400">
                          {p.coutAchat ? `${p.coutAchat.toLocaleString('fr-FR')} F` : '—'}
                        </td>
                        <td className="text-right">
                          <span className={`font-bold text-base ${stockTone(p)}`}>{p.stockActuel}</span>
                        </td>
                        <td className="text-right text-slate-500 dark:text-slate-400">{p.stockMin}</td>
                        <td><StatusBadge actif={p.actif} /></td>
                        {canEdit && (
                          <td>
                            <div className="flex flex-wrap gap-1.5">
                              <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                              <button onClick={() => toggleActif(p)} className="btn btn-ghost btn-sm">
                                {p.actif ? 'Archiver' : 'Restaurer'}
                              </button>
                              <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm">Suppr.</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredProduits.length === 0 && (
                      <tr>
                        <td colSpan={canEdit ? 8 : 7} className="py-10 text-center text-slate-400">
                          Aucun produit trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filteredProduits.map(p => (
              <article key={p.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900 dark:text-white">{p.nom}</h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {p.code && <span className="font-mono">{p.code} · </span>}
                      {p.categorie || 'Sans catégorie'}
                    </p>
                  </div>
                  <StatusBadge actif={p.actif} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MetricCell label="Prix vente" value={`${p.prix.toLocaleString('fr-FR')} F`} />
                  <MetricCell label="Stock" value={p.stockActuel} valueClass={stockTone(p)} />
                  <MetricCell label="Stock min" value={p.stockMin} />
                </div>
                {canEdit && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                    <button onClick={() => toggleActif(p)} className="btn btn-ghost btn-sm">{p.actif ? 'Archiver' : 'Restaurer'}</button>
                    <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm">Supprimer</button>
                  </div>
                )}
              </article>
            ))}
            {filteredProduits.length === 0 && <div className="empty-state">Aucun produit trouvé.</div>}
          </div>
        </>
      )}

      {/* ══════════════════════ ENTRÉE EN STOCK ══════════════════════ */}
      {activeTab === 'entree' && (
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Entrée en stock</h2>
              <p className="text-sm text-slate-400">Enregistrez les marchandises reçues.</p>
            </div>
            <button type="button" onClick={startCreate} className="btn btn-secondary btn-sm gap-2 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouveau produit
            </button>
          </div>

          <form onSubmit={handleEntree} className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-[minmax(0,2fr)_8rem_10rem_minmax(0,1.5fr)_minmax(0,1.5fr)]">
              <div>
                <label className="field-label">Produit *</label>
                <select
                  value={entreeForm.produitId}
                  onChange={e => setEntreeForm({ ...entreeForm, produitId: e.target.value })}
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
                  value={entreeForm.quantite}
                  onChange={e => setEntreeForm({ ...entreeForm, quantite: e.target.value })}
                  className="input-control"
                  required
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="field-label">Coût d'achat (Unitaire)</label>
                <input
                  type="number" min="0"
                  value={entreeForm.coutAchat}
                  onChange={e => setEntreeForm({ ...entreeForm, coutAchat: e.target.value })}
                  className="input-control"
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="field-label">Fournisseur</label>
                <select
                  value={entreeForm.fournisseurId}
                  onChange={e => setEntreeForm({ ...entreeForm, fournisseurId: e.target.value })}
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
                  value={entreeForm.raison}
                  onChange={e => setEntreeForm({ ...entreeForm, raison: e.target.value })}
                  className="input-control"
                  placeholder="Réapprovisionnement"
                />
              </div>
            </div>

            {entreeForm.fournisseurId && entreeForm.coutAchat && (
              <div className="flex items-center gap-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20 p-3">
                <input
                  type="checkbox"
                  id="creerDette"
                  checked={entreeForm.creerDette}
                  onChange={e => setEntreeForm({ ...entreeForm, creerDette: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="creerDette" className="text-sm font-medium text-teal-900 dark:text-teal-300 cursor-pointer">
                  Créer automatiquement une dette fournisseur de <strong>{(Number(entreeForm.quantite || 0) * Number(entreeForm.coutAchat || 0)).toLocaleString('fr-FR')} F</strong> pour ce fournisseur.
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveTab('catalogue')} className="btn btn-secondary">Annuler</button>
              <button type="submit" className="btn btn-success gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Valider l'entrée
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ══════════════════════ HISTORIQUE ══════════════════════ */}
      {activeTab === 'historique' && (
        <HistoriqueMouvements mouvements={mouvements} />
      )}
    </div>
  )
}

/* ── Product form ── */
function ProductForm({ title, form, setForm, onSubmit, submitLabel, allowInitialStock = false, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="panel overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="sm:col-span-2 xl:col-span-2">
            <label className="field-label">Nom du produit *</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="input-control" required placeholder="Nom du produit" />
          </div>
          <div>
            <label className="field-label">Prix de vente *</label>
            <input type="number" min="0" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} className="input-control" required placeholder="0" />
          </div>
          <div>
            <label className="field-label">Coût d'achat</label>
            <input type="number" min="0" value={form.coutAchat} onChange={e => setForm({ ...form, coutAchat: e.target.value })} className="input-control" placeholder="Optionnel" />
          </div>
          {allowInitialStock && (
            <div>
              <label className="field-label">Stock initial</label>
              <input type="number" min="0" value={form.stockActuel} onChange={e => setForm({ ...form, stockActuel: e.target.value })} className="input-control" />
            </div>
          )}
          <div>
            <label className="field-label">Stock minimum</label>
            <input type="number" min="0" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: e.target.value })} className="input-control" />
          </div>
          <div className="sm:col-span-2 xl:col-span-2">
            <label className="field-label">Catégorie</label>
            <input value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="input-control" placeholder="Boisson, plat, marchandise…" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">Annuler</button>
          )}
          <button type="submit" className="btn btn-success gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ── Movements history ── */
function HistoriqueMouvements({ mouvements }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="table-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <span>🕒</span>
            <h2 className="font-semibold">Historique des mouvements</h2>
            <span className="ml-auto text-sm text-slate-400">{mouvements.length} mouvement(s)</span>
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
                    <td className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-white">{m.produit?.nom}</td>
                    <td className="text-slate-600 dark:text-slate-300 font-medium">{m.fournisseur?.nom || '—'}</td>
                    <td><TypeBadge type={m.type} /></td>
                    <td className="text-right">
                      <span className={`font-mono font-bold ${m.type === 'ENTREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
                      </span>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">{m.raison || '—'}</td>
                  </tr>
                ))}
                {mouvements.length === 0 && (
                  <tr><td colSpan="6" className="py-10 text-center text-slate-400">Aucun mouvement enregistré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile */}
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
              <span className={`font-mono text-lg font-bold ${m.type === 'ENTREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
    </>
  )
}

/* ── Small components ── */
function StatusBadge({ actif }) {
  return actif
    ? <span className="badge badge-success">Actif</span>
    : <span className="badge badge-danger">Archivé</span>
}

function TypeBadge({ type }) {
  if (type === 'ENTREE') return <span className="badge badge-success">⬇ Entrée</span>
  if (type === 'SORTIE') return <span className="badge badge-danger">⬆ Sortie</span>
  return <span className="badge badge-warning">{type}</span>
}

function MetricCell({ label, value, valueClass = '' }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 font-bold ${valueClass || 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
  )
}

function stockTone(p) {
  if (p.stockActuel <= 0)          return 'text-rose-600 dark:text-rose-400'
  if (p.stockActuel <= p.stockMin) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-700 dark:text-emerald-400'
}
