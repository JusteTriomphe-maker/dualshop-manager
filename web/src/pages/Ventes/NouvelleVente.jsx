import { useEffect, useRef, useState } from 'react'
import api from '../../api/client'
import Receipt from '../../components/Receipt'
import { useReactToPrint } from '../../components/useReactToPrint'
import useAuthStore from '../../store/authStore'
import useVenteStore from '../../store/venteStore'

export default function NouvelleVente() {
  const [produits, setProduits] = useState([])
  const [search, setSearch] = useState('')
  const [modePaiement, setModePaiement] = useState('ESPECES')
  const [loading, setLoading] = useState(false)
  const [lastVente, setLastVente] = useState(null)
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [nouveauClient, setNouveauClient] = useState('')
  const [numeroTable, setNumeroTable] = useState('')
  const receiptRef = useRef()
  const { lignes, addProduit, updateQuantite, removeLigne, clear, total } = useVenteStore()
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  useEffect(() => {
    if (boutiqueId) {
      api.get('/clients', { params: { boutiqueId } }).then(res => setClients(res.data)).catch(() => {})
    }
  }, [boutiqueId])

  useEffect(() => {
    if (boutiqueId) {
      api.get(`/produits?boutiqueId=${boutiqueId}`).then(res => setProduits(res.data)).catch(() => {})
    }
  }, [boutiqueId])

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) && p.stockActuel > 0
  )

  const handlePrint = useReactToPrint({ contentRef: receiptRef })

  const handleVente = async () => {
    if (!boutiqueId || lignes.length === 0) return
    setError('')
    setLoading(true)
    try {
      const body = {
        boutiqueId,
        lignes: lignes.map(l => ({
          produitId: l.produitId,
          quantite: l.quantite,
          prixUnit: l.prixUnit,
        })),
        modePaiement,
        sourceDevice: 'web',
      }
      if (numeroTable) body.numeroTable = numeroTable
      if (modePaiement === 'CREDIT') {
        if (clientId) body.clientId = clientId
        else if (nouveauClient.trim()) body.nouveauClient = nouveauClient.trim()
        else {
          setError('Sélectionnez un client existant ou saisissez un nouveau nom')
          setLoading(false)
          return
        }
      }
      const res = await api.post('/ventes', body)
      setLastVente(res.data)
      clear()
      setNumeroTable('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle vente</h1>
          <p className="page-subtitle">Ajoutez les articles, choisissez le mode de paiement, puis validez.</p>
        </div>
        <div className="stat-card w-full sm:w-64">
          <p className="stat-label">Total panier</p>
          <p className="stat-value">{total().toLocaleString('fr-FR')} F</p>
          <p className="stat-meta">{lignes.length} article(s)</p>
        </div>
      </div>

      {!boutiqueId && (
        <div className="empty-state">Sélectionnez une boutique avant de créer une vente.</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="panel min-w-0">
          <div className="border-b border-slate-200 p-4">
            <label className="field-label">Recherche produit</label>
            <input
              type="text"
              placeholder="Nom du produit ou du plat"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-control"
            />
          </div>

          <div className="max-h-[34rem] overflow-y-auto p-4">
            {filtered.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.map(p => (
                  <article key={p.id} className="mobile-card flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold text-slate-950">{p.nom}</h2>
                        <span className="badge badge-neutral">Stock {p.stockActuel}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{p.prix.toLocaleString('fr-FR')} F</p>
                      {p.categorie && <p className="mt-1 text-xs text-slate-500">{p.categorie}</p>}
                    </div>
                    <button onClick={() => addProduit(p)} className="btn btn-primary btn-sm w-full">
                      Ajouter
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">Aucun produit disponible.</div>
            )}
          </div>
        </section>

        <aside className="panel h-fit xl:sticky xl:top-6">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Panier</h2>
                <p className="text-sm text-slate-500">{lignes.length} ligne(s)</p>
              </div>
              {lignes.length > 0 && (
                <button onClick={clear} className="btn btn-ghost btn-sm">
                  Vider
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4">
            {lignes.length === 0 ? (
              <div className="empty-state">Panier vide.</div>
            ) : (
              <>
                <div className="space-y-3">
                  {lignes.map(l => (
                    <div key={l.produitId} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{l.nom}</p>
                          <p className="text-sm text-slate-500">{l.prixUnit.toLocaleString('fr-FR')} F</p>
                        </div>
                        <button onClick={() => removeLigne(l.produitId)} className="btn btn-ghost btn-sm shrink-0">
                          ×
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantite(l.produitId, l.quantite - 1)} className="btn btn-secondary btn-sm w-8 px-0">
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-950">{l.quantite}</span>
                          <button onClick={() => updateQuantite(l.produitId, l.quantite + 1)} className="btn btn-secondary btn-sm w-8 px-0">
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-slate-950">{l.sousTotal.toLocaleString('fr-FR')} F</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-slate-950 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Total à payer</p>
                  <p className="mt-1 text-2xl font-semibold">{total().toLocaleString('fr-FR')} F</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="field-label">Mode de paiement</label>
                    <select
                      value={modePaiement}
                      onChange={e => {
                        setModePaiement(e.target.value)
                        if (e.target.value !== 'CREDIT') setClientId('')
                      }}
                      className="select-control"
                    >
                      <option value="ESPECES">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CARTE">Carte</option>
                      <option value="CREDIT">Crédit</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">N° table</label>
                    <input
                      type="text"
                      placeholder="Restau-bar"
                      value={numeroTable}
                      onChange={e => setNumeroTable(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  {modePaiement === 'CREDIT' && (
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div>
                        <label className="field-label">Client existant</label>
                        <select
                          value={clientId}
                          onChange={e => {
                            setClientId(e.target.value)
                            if (e.target.value) setNouveauClient('')
                          }}
                          className="select-control"
                        >
                          <option value="">Choisir un client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Nouveau client</label>
                        <input
                          type="text"
                          placeholder="Nom du client"
                          value={nouveauClient}
                          onChange={e => {
                            setNouveauClient(e.target.value)
                            if (e.target.value) setClientId('')
                          }}
                          className="input-control"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

                  <button onClick={handleVente} disabled={loading || lignes.length === 0} className="btn btn-success w-full">
                    {loading ? 'En cours...' : 'Valider la vente'}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {lastVente && (
        <section className="panel panel-pad">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">Vente enregistrée</h2>
              <p className="text-sm text-slate-500">{lastVente.numero}</p>
            </div>
            <button onClick={handlePrint} className="btn btn-secondary">
              Imprimer le reçu
            </button>
          </div>
          <div className="hidden">
            <Receipt ref={receiptRef} vente={lastVente} />
          </div>
        </section>
      )}
    </div>
  )
}
