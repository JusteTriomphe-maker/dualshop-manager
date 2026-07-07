import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Dettes() {
  const [dettesClients, setDettesClients]         = useState([])
  const [dettesFournisseurs, setDettesFournisseurs] = useState([])
  const [totalImpaye, setTotalImpaye]             = useState(0)
  const [totalDu, setTotalDu]                     = useState(0)
  const [tab, setTab]                             = useState('clients')
  const [paiementModal, setPaiementModal]         = useState(null)
  const [montantPaiement, setMontantPaiement]     = useState('')
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  const loadDettes = useCallback(async () => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    const res = await api.get('/dettes/rapport', { params })
    setDettesClients(res.data.clients.dettes)
    setTotalImpaye(res.data.clients.totalImpaye)
    setDettesFournisseurs(res.data.fournisseurs.dettes)
    setTotalDu(res.data.fournisseurs.totalDu)
  }, [boutiqueId])

  useEffect(() => { loadDettes().catch(() => {}) }, [loadDettes])

  const handlePaiement = async () => {
    if (!paiementModal || !montantPaiement) return
    try {
      const endpoint = paiementModal.type === 'client'
        ? '/dettes/paiement-client'
        : '/dettes/paiement-fournisseur'
      await api.post(endpoint, { detteId: paiementModal.id, montant: Number(montantPaiement) })
      setPaiementModal(null)
      setMontantPaiement('')
      await loadDettes()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const activeList = tab === 'clients' ? dettesClients : dettesFournisseurs

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dettes</h1>
          <p className="page-subtitle">Créances clients à encaisser et montants dus aux fournisseurs.</p>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card group relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-rose-500" />
          <div className="pl-3">
            <p className="stat-label">Créances clients</p>
            <p className="stat-value text-rose-600 dark:text-rose-400">{totalImpaye.toLocaleString('fr-FR')} <span className="text-base font-medium">F</span></p>
            <p className="stat-meta">{dettesClients.length} dossier(s)</p>
          </div>
        </div>
        <div className="stat-card relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-amber-500" />
          <div className="pl-3">
            <p className="stat-label">Dettes fournisseurs</p>
            <p className="stat-value text-amber-600 dark:text-amber-400">{totalDu.toLocaleString('fr-FR')} <span className="text-base font-medium">F</span></p>
            <p className="stat-meta">{dettesFournisseurs.length} dossier(s)</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-1">
        {[
          { key: 'clients',       label: 'Clients',       count: dettesClients.length,       color: 'text-rose-600' },
          { key: 'fournisseurs',  label: 'Fournisseurs',  count: dettesFournisseurs.length,   color: 'text-amber-600' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              tab === t.key ? t.color : 'text-slate-400'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Debt list ── */}
      <div className="space-y-3">
        {activeList.length === 0 && (
          <div className="empty-state">
            <p className="text-3xl mb-2">{tab === 'clients' ? '✅' : '📦'}</p>
            Aucune dette {tab === 'clients' ? 'client' : 'fournisseur'} enregistrée.
          </div>
        )}
        {activeList.map(d => {
          const isClient = tab === 'clients'
          const nom     = isClient ? d.client?.nom : d.fournisseur?.nom
          const restant = isClient ? d.montantRestant : d.montantDu - d.montantPaye
          const totalD  = isClient ? d.montant : d.montantDu
          const pct     = totalD > 0 ? Math.max(0, Math.min(100, 100 - (restant / totalD) * 100)) : 100
          return (
            <article key={d.id} className="panel p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {nom?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">{nom}</h2>
                    <DebtBadge statut={d.statut} />
                  </div>
                  <p className="mt-2 ml-11 text-sm text-slate-500 dark:text-slate-400">
                    {d.description || d.vente?.numero || d.produit?.nom || '—'}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-3 ml-11">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Remboursé</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Restant</p>
                    <p className={`text-xl font-bold ${isClient ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {restant.toLocaleString('fr-FR')} F
                    </p>
                    <p className="text-xs text-slate-400">/ {totalD.toLocaleString('fr-FR')} F</p>
                  </div>
                  {d.statut !== 'PAYEE' && (
                    <button
                      onClick={() => setPaiementModal({ id: d.id, type: isClient ? 'client' : 'fournisseur', nom, restant })}
                      className={`btn btn-sm gap-1.5 ${isClient ? 'btn-success' : 'btn-secondary'}`}
                    >
                      {isClient ? '💰 Encaisser' : '💸 Payer'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Payment modal ── */}
      {paiementModal && (
        <div className="modal-backdrop" onClick={() => setPaiementModal(null)}>
          <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                paiementModal.type === 'client'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
              }`}>
                {paiementModal.type === 'client' ? '💰' : '💸'}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {paiementModal.type === 'client' ? 'Encaissement' : 'Paiement fournisseur'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{paiementModal.nom}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 mb-4">
              <p className="stat-label">Restant dû</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {paiementModal.restant.toLocaleString('fr-FR')} F
              </p>
            </div>

            <div className="mb-5">
              <label className="field-label">Montant à saisir (F)</label>
              <input
                type="number"
                value={montantPaiement}
                onChange={e => setMontantPaiement(e.target.value)}
                className="input-control"
                placeholder="Ex: 5000"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setPaiementModal(null); setMontantPaiement('') }} className="btn btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={handlePaiement} disabled={!montantPaiement} className="btn btn-success flex-1">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DebtBadge({ statut }) {
  if (statut === 'PAYEE')    return <span className="badge badge-success">Payée</span>
  if (statut === 'PARTIELLE') return <span className="badge badge-warning">Partielle</span>
  return <span className="badge badge-danger">Impayée</span>
}
