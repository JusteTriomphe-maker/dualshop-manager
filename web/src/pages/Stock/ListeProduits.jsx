import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

const emptyProductForm = { nom: '', prix: '', coutAchat: '', stockActuel: 0, stockMin: 5, categorie: '' }
const emptyEntreeForm = { produitId: '', quantite: '', coutAchat: '', raison: '' }

export default function ListeProduits() {
  const [produits, setProduits] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [activeTab, setActiveTab] = useState('catalogue')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduit, setEditProduit] = useState(null)
  const [form, setForm] = useState(emptyProductForm)
  const [entreeForm, setEntreeForm] = useState(emptyEntreeForm)
  const user = useAuthStore(s => s.user)
  const boutiqueId = useAuthStore(s => s.boutiqueId)
  const canEdit = user?.role === 'DG' || user?.role === 'GERANT'

  const loadData = useCallback(async () => {
    const produitParams = {}
    if (boutiqueId) produitParams.boutiqueId = boutiqueId
    if (canEdit) produitParams.inclusInactifs = 'true'

    const produitsRes = await api.get('/produits', { params: produitParams })
    setProduits(produitsRes.data)

    if (boutiqueId) {
      const mouvementsRes = await api.get('/stock/mouvements', { params: { boutiqueId } })
      setMouvements(mouvementsRes.data)
    } else {
      setMouvements([])
    }
  }, [boutiqueId, canEdit])

  useEffect(() => {
    loadData().catch(() => {})
  }, [loadData])

  const filteredProduits = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return produits
    return produits.filter(p =>
      [p.nom, p.code, p.categorie].filter(Boolean).some(value => value.toLowerCase().includes(q))
    )
  }, [produits, search])

  const actifs = produits.filter(p => p.actif)
  const stockBas = actifs.filter(p => p.stockActuel <= p.stockMin).length
  const valeurVente = actifs.reduce((sum, p) => sum + (p.stockActuel * p.prix), 0)

  const resetForm = () => setForm(emptyProductForm)

  const payloadFromForm = (source) => ({
    nom: source.nom,
    boutiqueId,
    prix: Number(source.prix),
    coutAchat: source.coutAchat === '' ? undefined : Number(source.coutAchat),
    stockActuel: Number(source.stockActuel || 0),
    stockMin: Number(source.stockMin || 0),
    categorie: source.categorie,
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/produits', payloadFromForm(form))
      setShowForm(false)
      resetForm()
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/produits/${editProduit.id}`, {
        nom: form.nom,
        prix: Number(form.prix),
        coutAchat: form.coutAchat === '' ? undefined : Number(form.coutAchat),
        stockMin: Number(form.stockMin),
        categorie: form.categorie,
      })
      setEditProduit(null)
      resetForm()
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const handleEntree = async (e) => {
    e.preventDefault()
    try {
      await api.post('/stock/entree', {
        produitId: entreeForm.produitId,
        quantite: Number(entreeForm.quantite),
        coutAchat: entreeForm.coutAchat === '' ? undefined : Number(entreeForm.coutAchat),
        raison: entreeForm.raison || 'Réapprovisionnement',
        type: 'ENTREE',
      })
      setEntreeForm(emptyEntreeForm)
      await loadData()
      setActiveTab('catalogue')
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const openEdit = (p) => {
    setActiveTab('catalogue')
    setShowForm(false)
    setEditProduit(p)
    setForm({
      nom: p.nom,
      prix: String(p.prix),
      coutAchat: p.coutAchat === null || p.coutAchat === undefined ? '' : String(p.coutAchat),
      stockActuel: p.stockActuel,
      stockMin: p.stockMin,
      categorie: p.categorie || '',
    })
  }

  const startCreate = () => {
    setActiveTab('catalogue')
    setShowForm(true)
    setEditProduit(null)
    resetForm()
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer définitivement "${p.nom}" ?\n\nSi le produit a déjà été vendu, il sera archivé à la place.`)) return
    try {
      const res = await api.delete(`/produits/${p.id}`)
      alert(res.data.message)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const toggleActif = async (p) => {
    try {
      await api.put(`/produits/${p.id}`, { actif: !p.actif })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock</h1>
          <p className="page-subtitle">Produits, marchandises, réapprovisionnements et historique des mouvements.</p>
        </div>
        {canEdit && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button onClick={startCreate} className="btn btn-primary">Nouveau produit</button>
            <button onClick={() => setActiveTab('entree')} className="btn btn-success">Entrée en stock</button>
          </div>
        )}
      </div>

      {!boutiqueId && (
        <div className="empty-state">Sélectionnez une boutique avant de gérer le stock.</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card border-l-4 border-l-slate-700">
          <p className="stat-label">Produits actifs</p>
          <p className="stat-value">{actifs.length}</p>
          <p className="stat-meta">{produits.length - actifs.length} archivé(s)</p>
        </div>
        <div className="stat-card border-l-4 border-l-amber-500">
          <p className="stat-label">Stock bas</p>
          <p className="stat-value">{stockBas}</p>
          <p className="stat-meta">à vérifier</p>
        </div>
        <div className="stat-card border-l-4 border-l-teal-600">
          <p className="stat-label">Valeur stock vente</p>
          <p className="stat-value">{valeurVente.toLocaleString('fr-FR')} F</p>
          <p className="stat-meta">selon prix de vente</p>
        </div>
      </div>

      <div className="panel p-1">
        <div className="grid gap-1 sm:grid-cols-3">
          <TabButton active={activeTab === 'catalogue'} onClick={() => setActiveTab('catalogue')}>Catalogue</TabButton>
          <TabButton active={activeTab === 'entree'} onClick={() => setActiveTab('entree')}>Entrée en stock</TabButton>
          <TabButton active={activeTab === 'historique'} onClick={() => setActiveTab('historique')}>Historique</TabButton>
        </div>
      </div>

      {activeTab === 'catalogue' && (
        <>
          <div className="toolbar">
            <div className="w-full sm:max-w-md">
              <label className="field-label">Recherche</label>
              <input
                type="text"
                placeholder="Nom, code ou catégorie"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-control"
              />
            </div>
          </div>

          {showForm && !editProduit && (
            <ProductForm form={form} setForm={setForm} onSubmit={handleCreate} submitLabel="Créer le produit" allowInitialStock />
          )}

          {editProduit && (
            <ProductForm form={form} setForm={setForm} onSubmit={handleEdit} submitLabel="Enregistrer">
              <button type="button" onClick={() => { setEditProduit(null); resetForm() }} className="btn btn-secondary">
                Annuler
              </button>
            </ProductForm>
          )}

          <CatalogueTable produits={filteredProduits} canEdit={canEdit} onEdit={openEdit} onToggle={toggleActif} onDelete={handleDelete} />
        </>
      )}

      {activeTab === 'entree' && (
        <section className="panel panel-pad">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Entrée en stock</h2>
              <p className="text-sm text-slate-500">Ajoutez des quantités reçues pour une marchandise existante.</p>
            </div>
            <button type="button" onClick={startCreate} className="btn btn-secondary">
              Créer une nouvelle marchandise
            </button>
          </div>

          <form onSubmit={handleEntree} className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem_10rem_minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label className="field-label">Produit</label>
              <select value={entreeForm.produitId} onChange={e => setEntreeForm({ ...entreeForm, produitId: e.target.value })} className="select-control" required>
                <option value="">Choisir un produit</option>
                {actifs.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} (stock: {p.stockActuel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Quantité</label>
              <input type="number" min="1" value={entreeForm.quantite} onChange={e => setEntreeForm({ ...entreeForm, quantite: e.target.value })} className="input-control" required />
            </div>
            <div>
              <label className="field-label">Coût achat</label>
              <input type="number" min="0" value={entreeForm.coutAchat} onChange={e => setEntreeForm({ ...entreeForm, coutAchat: e.target.value })} className="input-control" placeholder="Optionnel" />
            </div>
            <div>
              <label className="field-label">Motif</label>
              <input value={entreeForm.raison} onChange={e => setEntreeForm({ ...entreeForm, raison: e.target.value })} className="input-control" placeholder="Achat marchandises" />
            </div>
            <button type="submit" className="btn btn-success">Valider</button>
          </form>
        </section>
      )}

      {activeTab === 'historique' && (
        <HistoriqueMouvements mouvements={mouvements} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}>
      {children}
    </button>
  )
}

function ProductForm({ form, setForm, onSubmit, submitLabel, allowInitialStock = false, children }) {
  return (
    <form onSubmit={onSubmit} className="panel panel-pad grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <label className="field-label">Nom</label>
        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="input-control" required />
      </div>
      <div>
        <label className="field-label">Prix vente</label>
        <input type="number" min="0" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} className="input-control" required />
      </div>
      <div>
        <label className="field-label">Coût achat</label>
        <input type="number" min="0" value={form.coutAchat} onChange={e => setForm({ ...form, coutAchat: e.target.value })} className="input-control" />
      </div>
      {allowInitialStock && (
        <div>
          <label className="field-label">Stock initial</label>
          <input type="number" min="0" value={form.stockActuel} onChange={e => setForm({ ...form, stockActuel: e.target.value })} className="input-control" />
        </div>
      )}
      <div>
        <label className="field-label">Stock min</label>
        <input type="number" min="0" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: e.target.value })} className="input-control" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label">Catégorie</label>
        <input value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="input-control" placeholder="Marchandise, boisson, plat..." />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-3 lg:items-end">
        <button type="submit" className="btn btn-success flex-1">{submitLabel}</button>
        {children}
      </div>
    </form>
  )
}

function CatalogueTable({ produits, canEdit, onEdit, onToggle, onDelete }) {
  return (
    <>
      <div className="hidden md:block">
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th className="text-right">Prix vente</th>
                  <th className="text-right">Coût achat</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Min</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {produits.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-slate-950">{p.nom}</td>
                    <td>{p.code || '-'}</td>
                    <td className="text-right">{p.prix.toLocaleString('fr-FR')} F</td>
                    <td className="text-right">{p.coutAchat ? `${p.coutAchat.toLocaleString('fr-FR')} F` : '-'}</td>
                    <td className={`text-right font-semibold ${stockTone(p)}`}>{p.stockActuel}</td>
                    <td className="text-right">{p.stockMin}</td>
                    <td>{p.categorie || '-'}</td>
                    <td><StatusBadge actif={p.actif} /></td>
                    {canEdit && (
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => onEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                          <button onClick={() => onToggle(p)} className="btn btn-ghost btn-sm">
                            {p.actif ? 'Archiver' : 'Restaurer'}
                          </button>
                          <button onClick={() => onDelete(p)} className="btn btn-danger btn-sm">Supprimer</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {produits.length === 0 && (
                  <tr><td colSpan={canEdit ? 9 : 8} className="text-center text-slate-500">Aucun produit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {produits.map(p => (
          <article key={p.id} className="mobile-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{p.nom}</h2>
                <p className="mt-1 text-sm text-slate-500">{p.code || 'Sans code'} · {p.categorie || 'Sans catégorie'}</p>
              </div>
              <StatusBadge actif={p.actif} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Metric label="Prix" value={`${p.prix.toLocaleString('fr-FR')} F`} />
              <Metric label="Stock" value={p.stockActuel} valueClass={stockTone(p)} />
              <Metric label="Min" value={p.stockMin} />
            </div>
            {canEdit && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                <button onClick={() => onToggle(p)} className="btn btn-ghost btn-sm">{p.actif ? 'Archiver' : 'Restaurer'}</button>
                <button onClick={() => onDelete(p)} className="btn btn-danger btn-sm">Supprimer</button>
              </div>
            )}
          </article>
        ))}
        {produits.length === 0 && <div className="empty-state">Aucun produit</div>}
      </div>
    </>
  )
}

function HistoriqueMouvements({ mouvements }) {
  return (
    <>
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
    </>
  )
}

function StatusBadge({ actif }) {
  return actif ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Archivé</span>
}

function TypeBadge({ type }) {
  if (type === 'ENTREE') return <span className="badge badge-success">Entrée</span>
  if (type === 'SORTIE') return <span className="badge badge-danger">Sortie</span>
  return <span className="badge badge-warning">{type}</span>
}

function Metric({ label, value, valueClass = 'text-slate-950' }) {
  return (
    <div className="rounded-lg bg-stone-50 p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function stockTone(produit) {
  if (produit.stockActuel <= 0) return 'text-rose-600'
  if (produit.stockActuel <= produit.stockMin) return 'text-amber-600'
  return 'text-emerald-700'
}
