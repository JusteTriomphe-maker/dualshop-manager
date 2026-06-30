import { useCallback, useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function ListeProduits() {
  const [produits, setProduits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editProduit, setEditProduit] = useState(null)
  const [form, setForm] = useState({ nom: '', prix: '', stockActuel: 0, stockMin: 5, categorie: '' })
  const user = useAuthStore(s => s.user)
  const boutiqueId = useAuthStore(s => s.boutiqueId)
  const canEdit = user?.role === 'DG' || user?.role === 'GERANT'

  const loadProduits = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    if (canEdit) params.inclusInactifs = 'true'
    const res = await api.get('/produits', { params })
    setProduits(res.data)
  }, [boutiqueId, canEdit])

  useEffect(() => {
    loadProduits().catch(() => {})
  }, [loadProduits])

  const resetForm = () => setForm({ nom: '', prix: '', stockActuel: 0, stockMin: 5, categorie: '' })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/produits', { ...form, boutiqueId, prix: Number(form.prix), stockActuel: Number(form.stockActuel), stockMin: Number(form.stockMin) })
      setShowForm(false)
      resetForm()
      await loadProduits()
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
        stockMin: Number(form.stockMin),
        categorie: form.categorie,
      })
      setEditProduit(null)
      resetForm()
      await loadProduits()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const openEdit = (p) => {
    setShowForm(false)
    setEditProduit(p)
    setForm({ nom: p.nom, prix: String(p.prix), stockActuel: p.stockActuel, stockMin: p.stockMin, categorie: p.categorie || '' })
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer définitivement "${p.nom}" ?\n\nSi le produit a déjà été vendu, il sera archivé à la place.`)) return
    try {
      const res = await api.delete(`/produits/${p.id}`)
      alert(res.data.message)
      await loadProduits()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const toggleActif = async (p) => {
    try {
      await api.put(`/produits/${p.id}`, { actif: !p.actif })
      await loadProduits()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Produits / Plats</h1>
          <p className="page-subtitle">Catalogue, prix de vente et niveaux de stock.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditProduit(null)
              resetForm()
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Annuler' : 'Nouveau produit'}
          </button>
        )}
      </div>

      {showForm && !editProduit && (
        <ProductForm form={form} setForm={setForm} onSubmit={handleCreate} submitLabel="Créer" allowInitialStock />
      )}

      {editProduit && (
        <ProductForm form={form} setForm={setForm} onSubmit={handleEdit} submitLabel="Enregistrer">
          <button type="button" onClick={() => { setEditProduit(null); resetForm() }} className="btn btn-secondary">
            Annuler
          </button>
        </ProductForm>
      )}

      <div className="hidden md:block">
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th className="text-right">Prix</th>
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
                    <td className={`text-right font-semibold ${stockTone(p)}`}>{p.stockActuel}</td>
                    <td className="text-right">{p.stockMin}</td>
                    <td>{p.categorie || '-'}</td>
                    <td><StatusBadge actif={p.actif} /></td>
                    {canEdit && (
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                          <button onClick={() => toggleActif(p)} className="btn btn-ghost btn-sm">
                            {p.actif ? 'Archiver' : 'Restaurer'}
                          </button>
                          <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm">Supprimer</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {produits.length === 0 && (
                  <tr><td colSpan={canEdit ? 8 : 7} className="text-center text-slate-500">Aucun produit</td></tr>
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
                <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Modifier</button>
                <button onClick={() => toggleActif(p)} className="btn btn-ghost btn-sm">{p.actif ? 'Archiver' : 'Restaurer'}</button>
                <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm">Supprimer</button>
              </div>
            )}
          </article>
        ))}
        {produits.length === 0 && <div className="empty-state">Aucun produit</div>}
      </div>
    </div>
  )
}

function ProductForm({ form, setForm, onSubmit, submitLabel, allowInitialStock = false, children }) {
  return (
    <form onSubmit={onSubmit} className="panel panel-pad grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <label className="field-label">Nom</label>
        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="input-control" required />
      </div>
      <div>
        <label className="field-label">Prix</label>
        <input type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} className="input-control" required />
      </div>
      {allowInitialStock && (
        <div>
          <label className="field-label">Stock initial</label>
          <input type="number" value={form.stockActuel} onChange={e => setForm({ ...form, stockActuel: e.target.value })} className="input-control" />
        </div>
      )}
      <div>
        <label className="field-label">Stock min</label>
        <input type="number" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: e.target.value })} className="input-control" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label">Catégorie</label>
        <input value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="input-control" />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-2 lg:items-end">
        <button type="submit" className="btn btn-success flex-1">{submitLabel}</button>
        {children}
      </div>
    </form>
  )
}

function StatusBadge({ actif }) {
  return actif ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Archivé</span>
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
