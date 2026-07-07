import { useEffect, useRef, useState } from 'react'
import api from '../../api/client'
import Receipt from '../../components/Receipt'
import { useReactToPrint } from '../../components/useReactToPrint'
import useAuthStore from '../../store/authStore'
import useVenteStore from '../../store/venteStore'

const PAYMENT_MODES = [
  { value: 'ESPECES',      label: 'Espèces',      icon: '💵' },
  { value: 'CREDIT',       label: 'Crédit',       icon: '🤝' },
]

export default function NouvelleVente() {
  const [produits, setProduits]         = useState([])
  const [search, setSearch]             = useState('')
  const [modePaiement, setModePaiement] = useState('ESPECES')
  const [loading, setLoading]           = useState(false)
  const [lastVente, setLastVente]       = useState(null)
  const [error, setError]               = useState('')
  const [clients, setClients]           = useState([])
  const [clientId, setClientId]         = useState('')
  const [nouveauClient, setNouveauClient] = useState('')
  const [numeroTable, setNumeroTable]   = useState('')
  const [venteActive, setVenteActive]   = useState(false)
  const [filterCateg, setFilterCateg]   = useState('Tous')

  const receiptRef = useRef()
  const { lignes, addProduit, updateQuantite, removeLigne, clear, total } = useVenteStore()
  const boutiqueId   = useAuthStore(s => s.boutiqueId)
  const boutiqueType = useAuthStore(s => s.boutiqueType)
  const isRestaubar  = boutiqueType === 'RESTAUBAR'

  useEffect(() => {
    if (boutiqueId) {
      api.get('/clients', { params: { boutiqueId } }).then(r => setClients(r.data)).catch(() => {})
      api.get(`/produits?boutiqueId=${boutiqueId}`).then(r => setProduits(r.data)).catch(() => {})
    }
  }, [boutiqueId])

  const categories = ['Tous', ...new Set(produits.map(p => p.categorie).filter(Boolean))]

  const filtered = produits.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) && p.stockActuel > 0
    const matchCateg  = filterCateg === 'Tous' || p.categorie === filterCateg
    return matchSearch && matchCateg
  })

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
          quantite: parseInt(l.quantite, 10),
          prixUnit: parseFloat(l.prixUnit),
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
      setVenteActive(false)
      api.get(`/produits?boutiqueId=${boutiqueId}`).then(r => setProduits(r.data)).catch(() => {})
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vente</h1>
          <p className="page-subtitle">Sélectionnez les produits, remplissez le panier et validez le paiement.</p>
        </div>
        <div className="flex items-center gap-3">
          {!venteActive && (
            <button
              type="button"
              onClick={() => setVenteActive(true)}
              className="btn btn-success gap-2 px-6 text-base h-12 shadow-lg shadow-teal-700/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouvelle vente
            </button>
          )}
          <div className="stat-card min-w-[11rem] text-right">
            <p className="stat-label">Panier</p>
            <p className="stat-value text-xl">{total().toLocaleString('fr-FR')} <span className="text-sm font-medium">F</span></p>
            <p className="stat-meta">{lignes.length} article(s)</p>
          </div>
        </div>
      </div>

      {!boutiqueId && (
        <div className="empty-state">Sélectionnez une boutique avant de créer une vente.</div>
      )}

      {/* ── Success banner ── */}
      {lastVente && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-lg">✓</div>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Vente enregistrée avec succès</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-mono">{lastVente.numero}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePrint} className="btn btn-secondary gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Imprimer le reçu
            </button>
            <button onClick={() => setLastVente(null)} className="btn btn-ghost btn-sm">Fermer</button>
          </div>
          <div className="hidden"><Receipt ref={receiptRef} vente={lastVente} /></div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">

        {/* ── Products panel ── */}
        <section className="panel min-w-0 overflow-hidden">
          {venteActive ? (
            <>
              {/* Toolbar */}
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher un produit…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="input-control pl-9"
                    />
                  </div>
                  <span className="badge badge-success whitespace-nowrap">Vente en cours</span>
                </div>
                {/* Category pills */}
                {categories.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setFilterCateg(c)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          filterCateg === c
                            ? 'bg-teal-700 text-white shadow'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product grid */}
              <div className="max-h-[38rem] overflow-y-auto p-4">
                {filtered.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {filtered.map(p => {
                      const inCart = lignes.find(l => l.produitId === p.id)
                      return (
                        <article
                          key={p.id}
                          onClick={() => addProduit(p)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addProduit(p) } }}
                          role="button"
                          tabIndex={0}
                          className={`group relative cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-150 active:scale-[0.98] ${
                            inCart
                              ? 'border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-950/40'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 hover:border-teal-300 hover:shadow-md'
                          }`}
                        >
                          {inCart && (
                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                              {inCart.quantite}
                            </div>
                          )}
                          <p className="pr-7 font-semibold text-slate-900 dark:text-white leading-snug">{p.nom}</p>
                          {p.categorie && (
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{p.categorie}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-base font-bold text-teal-700 dark:text-teal-400">
                              {p.prix.toLocaleString('fr-FR')} F
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.stockActuel <= 5
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              Stock {p.stockActuel}
                            </span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="empty-state">Aucun produit disponible.</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[26rem] flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-4xl">🛒</div>
              <div>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">Prêt pour une nouvelle vente</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Le panier est à droite. Cliquez sur le bouton pour afficher les produits disponibles.</p>
              </div>
              <button
                type="button"
                onClick={() => setVenteActive(true)}
                className="btn btn-success gap-2 px-8 shadow-lg shadow-teal-700/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Démarrer la vente
              </button>
            </div>
          )}
        </section>

        {/* ── Cart aside ── */}
        <aside className="panel h-fit xl:sticky xl:top-6 overflow-hidden">
          {/* Cart header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-950 dark:bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <h2 className="font-semibold">Panier</h2>
              {lignes.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold">{lignes.length}</span>
              )}
            </div>
            {lignes.length > 0 && (
              <button onClick={clear} className="text-xs text-slate-400 hover:text-rose-400 transition font-medium">
                Vider
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {lignes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 py-10 text-center">
                <span className="text-3xl">🛍️</span>
                <p className="text-sm text-slate-400">Le panier est vide</p>
                {!venteActive && (
                  <button type="button" onClick={() => setVenteActive(true)} className="btn btn-success btn-sm mt-1">
                    Démarrer
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Lines */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {lignes.map(l => (
                    <div
                      key={l.produitId}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{l.nom}</p>
                        <p className="text-xs text-slate-500">{l.prixUnit.toLocaleString('fr-FR')} F / u</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateQuantite(l.produitId, l.quantite - 1)}
                          className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >−</button>
                        <span className="w-7 text-center text-sm font-bold text-slate-900 dark:text-white">{l.quantite}</span>
                        <button
                          onClick={() => updateQuantite(l.produitId, l.quantite + 1)}
                          className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >+</button>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{l.sousTotal.toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] text-slate-400">F</p>
                      </div>
                      <button
                        onClick={() => removeLigne(l.produitId)}
                        className="shrink-0 text-slate-300 hover:text-rose-500 transition text-lg leading-none"
                      >×</button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total à payer</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight">
                        {total().toLocaleString('fr-FR')}
                        <span className="ml-1 text-lg font-medium text-slate-400">F</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{lignes.length} article(s)</p>
                    </div>
                  </div>
                </div>

                {/* Payment mode */}
                <div>
                  <label className="field-label">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_MODES.map(pm => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => { setModePaiement(pm.value); if (pm.value !== 'CREDIT') setClientId('') }}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          modePaiement === pm.value
                            ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 shadow'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                        }`}
                      >
                        <span>{pm.icon}</span>
                        <span className="truncate">{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table number (restaubar) */}
                {isRestaubar && (
                  <div>
                    <label className="field-label">N° de table</label>
                    <input
                      type="text"
                      placeholder="Ex: 12"
                      value={numeroTable}
                      onChange={e => setNumeroTable(e.target.value)}
                      className="input-control"
                    />
                  </div>
                )}

                {/* Credit client */}
                {modePaiement === 'CREDIT' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <span>⚠️</span>
                      <p className="text-xs font-semibold uppercase tracking-wide">Vente à crédit — identifiez le client</p>
                    </div>
                    <div>
                      <label className="field-label">Client existant</label>
                      <select
                        value={clientId}
                        onChange={e => { setClientId(e.target.value); if (e.target.value) setNouveauClient('') }}
                        className="select-control"
                      >
                        <option value="">Choisir un client…</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Nouveau client</label>
                      <input
                        type="text"
                        placeholder="Nom du client"
                        value={nouveauClient}
                        onChange={e => { setNouveauClient(e.target.value); if (e.target.value) setClientId('') }}
                        className="input-control"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-2">
                    <span className="text-rose-500">⚠</span>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVente}
                  disabled={loading || lignes.length === 0}
                  className="btn btn-success w-full h-12 text-base gap-2 shadow-lg shadow-teal-700/20"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Traitement…
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Valider la vente
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
