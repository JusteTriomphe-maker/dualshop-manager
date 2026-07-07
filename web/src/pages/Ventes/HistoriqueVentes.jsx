import { useEffect, useRef, useState } from 'react'
import api from '../../api/client'
import Receipt from '../../components/Receipt'
import { useReactToPrint } from '../../components/useReactToPrint'
import useAuthStore from '../../store/authStore'

export default function HistoriqueVentes() {
  const [ventes, setVentes]           = useState([])
  const [dateDebut, setDateDebut]     = useState('')
  const [dateFin, setDateFin]         = useState('')
  const [totalPeriode, setTotalPeriode] = useState(0)
  const [selectedVente, setSelectedVente] = useState(null)
  const receiptRef = useRef()
  const boutiqueId = useAuthStore(s => s.boutiqueId)
  const handlePrint = useReactToPrint({ contentRef: receiptRef })

  useEffect(() => {
    const params = {}
    if (boutiqueId) params.boutiqueId = boutiqueId
    api.get('/ventes', { params }).then(res => {
      let data = res.data
      if (dateDebut) {
        const debut = new Date(dateDebut)
        data = data.filter(v => new Date(v.createdAt) >= debut)
      }
      if (dateFin) {
        const fin = new Date(dateFin)
        fin.setDate(fin.getDate() + 1)
        data = data.filter(v => new Date(v.createdAt) < fin)
      }
      setVentes(data)
      setTotalPeriode(data.reduce((s, v) => s + v.total, 0))
    }).catch(() => {})
  }, [boutiqueId, dateDebut, dateFin])

  const grouped = ventes.reduce((acc, v) => {
    const day = new Date(v.createdAt).toLocaleDateString('fr-CG', {
      timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', year: 'numeric',
    })
    if (!acc[day]) acc[day] = { ventes: [], total: 0 }
    acc[day].ventes.push(v)
    acc[day].total += v.total
    return acc
  }, {})

  const sortedDays = Object.entries(grouped).sort((a, b) => {
    const [da, db] = [a[0].split('/').reverse().join('-'), b[0].split('/').reverse().join('-')]
    return db.localeCompare(da)
  })

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des ventes</h1>
          <p className="page-subtitle">Chiffre d'affaires, modes de paiement et statuts par journée.</p>
        </div>
        <div className="stat-card min-w-[13rem] text-right">
          <p className="stat-label">Total période</p>
          <p className="stat-value text-xl">{totalPeriode.toLocaleString('fr-FR')} <span className="text-sm font-medium">F</span></p>
          <p className="stat-meta">{ventes.length} vente(s)</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="toolbar">
        <div className="grid w-full gap-3 sm:grid-cols-2 sm:max-w-lg">
          <div>
            <label className="field-label">Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="input-control" />
          </div>
          <div>
            <label className="field-label">Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="input-control" />
          </div>
        </div>
        <button
          onClick={() => { setDateDebut(''); setDateFin('') }}
          className="btn btn-secondary gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Réinitialiser
        </button>
      </div>

      {/* ── Content ── */}
      {sortedDays.length === 0 ? (
        <div className="empty-state">
          <p className="text-3xl mb-3">📋</p>
          Aucune vente trouvée pour cette période.
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDays.map(([day, group]) => (
            <section key={day} className="panel overflow-hidden">
              {/* Day header */}
              <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600/30 text-teal-300 text-sm">
                    📅
                  </div>
                  <h2 className="font-semibold tracking-wide">{day}</h2>
                  <span className="hidden sm:inline text-xs text-slate-400">{group.ventes.length} vente(s)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-teal-400">{group.total.toLocaleString('fr-FR')} F</span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Heure</th>
                      <th>Boutique</th>
                      <th>Caissier</th>
                      <th>Table</th>
                      <th>Client</th>
                      <th>Total</th>
                      <th>Paiement</th>
                      <th>Statut</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.ventes.map(v => (
                      <tr key={v.id}>
                        <td>
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {v.numero}
                          </span>
                        </td>
                        <td className="text-slate-500 dark:text-slate-400">
                          {new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{v.boutique?.nom || '—'}</td>
                        <td>{v.caissier?.nom || '—'}</td>
                        <td className="text-center">{v.numeroTable || '—'}</td>
                        <td>{v.client?.nom || '—'}</td>
                        <td>
                          <span className="font-bold text-slate-900 dark:text-white">{v.total.toLocaleString('fr-FR')}</span>
                          <span className="text-xs text-slate-400 ml-1">F</span>
                        </td>
                        <td><PaymentBadge mode={v.modePaiement} /></td>
                        <td><SaleStatus statut={v.statut} /></td>
                        <td>
                          <button
                            onClick={() => setSelectedVente(v)}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                          >
                            Reçu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 p-4 md:hidden">
                {group.ventes.map(v => (
                  <article key={v.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">
                          {v.numero}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <SaleStatus statut={v.statut} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <InfoCell label="Total" value={`${v.total.toLocaleString('fr-FR')} F`} strong />
                      <InfoCell label="Paiement" value={paymentLabel(v.modePaiement)} />
                      <InfoCell label="Caissier" value={v.caissier?.nom || '—'} />
                      <InfoCell label="Client" value={v.client?.nom || '—'} />
                    </div>
                    <button
                      onClick={() => setSelectedVente(v)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                    >
                      Voir le reçu →
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Receipt modal ── */}
      {selectedVente && (
        <div className="modal-backdrop" onClick={() => setSelectedVente(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reçu de vente</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn btn-secondary btn-sm gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Imprimer
                </button>
                <button onClick={() => setSelectedVente(null)} className="btn btn-ghost btn-sm">Fermer</button>
              </div>
            </div>
            <Receipt ref={receiptRef} vente={selectedVente} />
          </div>
        </div>
      )}
    </div>
  )
}

function SaleStatus({ statut }) {
  if (statut === 'COMPLETEE') return <span className="badge badge-success">Complétée</span>
  if (statut === 'ANNULEE')   return <span className="badge badge-danger">Annulée</span>
  return <span className="badge badge-warning">{statut}</span>
}

function PaymentBadge({ mode }) {
  const icons = {
    ESPECES:      { icon: '💵', label: 'Espèces',      cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    MOBILE_MONEY: { icon: '📱', label: 'Mobile Money', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    CARTE:        { icon: '💳', label: 'Carte',        cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    CREDIT:       { icon: '🤝', label: 'Crédit',       cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  }
  const p = icons[mode] || { icon: '?', label: mode, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`}>
      {p.icon} {p.label}
    </span>
  )
}

function paymentLabel(mode) {
  return { ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money', CARTE: 'Carte', CREDIT: 'Crédit' }[mode] || mode
}

function InfoCell({ label, value, strong = false }) {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-sm ${strong ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{value}</p>
    </div>
  )
}
