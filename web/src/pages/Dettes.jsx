import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Dettes() {
  const [dettesClients, setDettesClients] = useState([])
  const [dettesFournisseurs, setDettesFournisseurs] = useState([])
  const [totalImpaye, setTotalImpaye] = useState(0)
  const [totalDu, setTotalDu] = useState(0)
  const [tab, setTab] = useState('clients')
  const [paiementModal, setPaiementModal] = useState(null)
  const [montantPaiement, setMontantPaiement] = useState('')
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

  useEffect(() => {
    loadDettes().catch(() => {})
  }, [loadDettes])

  const handlePaiement = async () => {
    if (!paiementModal || !montantPaiement) return
    try {
      const endpoint = paiementModal.type === 'client' ? '/dettes/paiement-client' : '/dettes/paiement-fournisseur'
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dettes</h1>
          <p className="page-subtitle">Créances clients et montants dus aux fournisseurs.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="stat-card border-l-4 border-l-rose-600">
          <p className="stat-label">Créances clients</p>
          <p className="stat-value text-rose-700">{totalImpaye.toLocaleString('fr-FR')} F</p>
          <p className="stat-meta">{dettesClients.length} dossier(s)</p>
        </div>
        <div className="stat-card border-l-4 border-l-amber-500">
          <p className="stat-label">Dettes fournisseurs</p>
          <p className="stat-value text-amber-700">{totalDu.toLocaleString('fr-FR')} F</p>
          <p className="stat-meta">{dettesFournisseurs.length} dossier(s)</p>
        </div>
      </div>

      <div className="panel p-1">
        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => setTab('clients')} className={`btn ${tab === 'clients' ? 'btn-primary' : 'btn-ghost'}`}>
            Clients ({dettesClients.length})
          </button>
          <button onClick={() => setTab('fournisseurs')} className={`btn ${tab === 'fournisseurs' ? 'btn-primary' : 'btn-ghost'}`}>
            Fournisseurs ({dettesFournisseurs.length})
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {activeList.map(d => {
          const isClient = tab === 'clients'
          const nom = isClient ? d.client?.nom : d.fournisseur?.nom
          const restant = isClient ? d.montantRestant : d.montantDu - d.montantPaye
          return (
            <article key={d.id} className="mobile-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">{nom}</h2>
                  <DebtBadge statut={d.statut} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{d.description || d.vente?.numero || d.produit?.nom || '-'}</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                <p className="text-lg font-semibold text-slate-950">{restant.toLocaleString('fr-FR')} F</p>
                {d.statut !== 'PAYEE' && (
                  <button
                    onClick={() => setPaiementModal({ id: d.id, type: isClient ? 'client' : 'fournisseur', nom, restant })}
                    className="btn btn-secondary btn-sm"
                  >
                    {isClient ? 'Encaisser' : 'Payer'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
        {activeList.length === 0 && <div className="empty-state">Aucune dette {tab === 'clients' ? 'client' : 'fournisseur'}</div>}
      </div>

      {paiementModal && (
        <div className="modal-backdrop" onClick={() => setPaiementModal(null)}>
          <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-950">
              {paiementModal.type === 'client' ? 'Encaissement' : 'Paiement'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{paiementModal.nom}</p>
            <div className="mt-4 rounded-lg bg-stone-50 p-3">
              <p className="stat-label">Restant dû</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{paiementModal.restant.toLocaleString('fr-FR')} F</p>
            </div>
            <div className="mt-4">
              <label className="field-label">Montant</label>
              <input type="number" value={montantPaiement} onChange={e => setMontantPaiement(e.target.value)} className="input-control" />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setPaiementModal(null)} className="btn btn-secondary flex-1">Annuler</button>
              <button onClick={handlePaiement} className="btn btn-success flex-1">Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DebtBadge({ statut }) {
  if (statut === 'PAYEE') return <span className="badge badge-success">Payée</span>
  if (statut === 'PARTIELLE') return <span className="badge badge-warning">Partielle</span>
  return <span className="badge badge-danger">Impayée</span>
}
