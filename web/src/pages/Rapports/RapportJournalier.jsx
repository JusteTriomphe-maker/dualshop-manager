import { useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

const todayInput = () => new Date().toISOString().slice(0, 10)

const PERIODS = [
  { value: 'jour',    label: 'Aujourd\'hui',        icon: '📅' },
  { value: 'semaine', label: '7 derniers jours',    icon: '📆' },
  { value: 'mois',    label: '30 derniers jours',   icon: '🗓️' },
]

export default function RapportJournalier() {
  const [periode, setPeriode]       = useState('jour')
  const [dateJour, setDateJour]     = useState(todayInput())
  const [rapport, setRapport]       = useState(null)
  const [topProduits, setTopProduits] = useState([])
  const [inventaire, setInventaire] = useState(null)
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  useEffect(() => {
    if (!boutiqueId) return
    setRapport(null)

    if (periode === 'jour') {
      api.get('/rapports/ca-journalier', { params: { boutiqueId, date: dateJour } })
        .then(r => setRapport(r.data)).catch(() => {})
    } else {
      const debut = new Date()
      if (periode === 'semaine') debut.setDate(debut.getDate() - 7)
      else debut.setMonth(debut.getMonth() - 1)
      api.get('/rapports/ca-periode', { params: { boutiqueId, debut: debut.toISOString() } })
        .then(r => setRapport(r.data)).catch(() => {})
    }

    api.get('/rapports/top-produits', { params: { boutiqueId, periode: periode === 'mois' ? '30j' : '7j' } })
      .then(r => setTopProduits(r.data)).catch(() => {})
    api.get('/rapports/inventaire', { params: { boutiqueId } })
      .then(r => setInventaire(r.data)).catch(() => {})
  }, [boutiqueId, periode, dateJour])

  const panierMoyen = rapport?.nbVentes > 0 ? Math.round(rapport.ca / rapport.nbVentes) : 0

  const handlePrintReport = () => {
    if (!rapport) return
    openPrintableReport({ periode, dateJour, rapport, topProduits, inventaire })
  }

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Chiffres journaliers, ventes détaillées, top produits et inventaire.</p>
        </div>
        <button
          onClick={handlePrintReport}
          disabled={!rapport}
          className="btn btn-secondary gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Voir / PDF
        </button>
      </div>

      {!boutiqueId && <div className="empty-state">Sélectionnez une boutique pour afficher les rapports.</div>}

      {/* ── Period selector ── */}
      <div className="panel p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Period pills */}
          <div className="flex-1">
            <p className="field-label mb-2">Période</p>
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriode(p.value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    periode === p.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                  }`}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {/* Date picker */}
          {periode === 'jour' && (
            <div className="sm:w-48">
              <label className="field-label">Date</label>
              <input
                type="date"
                value={dateJour}
                onChange={e => setDateJour(e.target.value)}
                className="input-control"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      {rapport ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Chiffre d'affaires"
            value={`${rapport.ca?.toLocaleString('fr-FR')} F`}
            icon="💹"
            color="teal"
          />
          <KpiCard
            label="Nombre de ventes"
            value={rapport.nbVentes}
            icon="🧾"
            color="sky"
          />
          <KpiCard
            label="Panier moyen"
            value={`${panierMoyen.toLocaleString('fr-FR')} F`}
            icon="🛒"
            color="amber"
          />
        </div>
      ) : boutiqueId ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
              <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Sales table ── */}
      {periode === 'jour' && rapport?.ventes && (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <div>
              <h2 className="font-semibold">Ventes du jour</h2>
              <p className="text-xs text-slate-400">{formatDateInput(dateJour)}</p>
            </div>
            <span className="badge badge-success">{rapport.ventes.length} vente(s)</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Heure</th>
                  <th>Total</th>
                  <th>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {rapport.ventes.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {v.numero}
                      </span>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      {new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-bold text-slate-900 dark:text-white">{v.total.toLocaleString('fr-FR')} F</td>
                    <td><PaymentBadge mode={v.modePaiement} /></td>
                  </tr>
                ))}
                {rapport.ventes.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-slate-400 py-6">Aucune vente ce jour.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── By-day table ── */}
      {periode !== 'jour' && rapport?.parJour && (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <h2 className="font-semibold">Chiffres par jour</h2>
            <span className="text-sm text-slate-400">{rapport.parJour.length} jours</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Ventes</th>
                  <th>Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                {rapport.parJour.map(row => (
                  <tr key={row.jour}>
                    <td className="font-semibold text-slate-900 dark:text-white">{formatDateInput(row.jour)}</td>
                    <td className="text-slate-500 dark:text-slate-400">{row.nb}</td>
                    <td className="font-bold text-teal-700 dark:text-teal-400">{row.ca.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
                {rapport.parJour.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-slate-400 py-6">Aucune donnée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Top produits + Inventaire ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Top produits */}
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <span>🏆</span>
            <h2 className="font-semibold">Top produits</h2>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produit</th>
                  <th>Qté vendue</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {topProduits.map((p, i) => (
                  <tr key={p.produitId}>
                    <td>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-white">{p.nom}</td>
                    <td className="text-slate-500 dark:text-slate-400">{p.quantiteVendue}</td>
                    <td className="font-bold text-teal-700 dark:text-teal-400">{p.totalVente?.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
                {topProduits.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-slate-400 py-6">Aucune donnée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Inventaire */}
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-950 px-5 py-3.5 text-white">
            <span>📦</span>
            <h2 className="font-semibold">Inventaire</h2>
          </div>
          {inventaire ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                  <p className="stat-label">Valeur achat</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {inventaire.valeurStock?.toLocaleString('fr-FR')} F
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                  <p className="stat-label">Valeur vente</p>
                  <p className="mt-1 text-lg font-bold text-teal-700 dark:text-teal-400">
                    {inventaire.valeurVente?.toLocaleString('fr-FR')} F
                  </p>
                </div>
              </div>
              <div className="table-scroll rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventaire.produits?.filter(p => p.stockActuel > 0).slice(0, 10).map(p => (
                      <tr key={p.id}>
                        <td className="font-semibold text-slate-900 dark:text-white">{p.nom}</td>
                        <td>
                          <span className={`font-bold ${
                            p.stockActuel <= 5
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}>{p.stockActuel}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4"><div className="empty-state">Aucune donnée d'inventaire.</div></div>
          )}
        </section>
      </div>
    </div>
  )
}

/* ── Sub-components ── */
function KpiCard({ label, value, icon, color }) {
  const colors = {
    teal:  'from-teal-600 to-teal-700',
    sky:   'from-sky-600 to-sky-700',
    amber: 'from-amber-500 to-amber-600',
  }
  return (
    <div className="stat-card relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${colors[color]} opacity-10`} />
      <div className="text-2xl mb-1">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  )
}

function PaymentBadge({ mode }) {
  const map = {
    ESPECES:      { icon: '💵', label: 'Espèces',      cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    MOBILE_MONEY: { icon: '📱', label: 'Mobile Money', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    CARTE:        { icon: '💳', label: 'Carte',        cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    CREDIT:       { icon: '🤝', label: 'Crédit',       cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  }
  const p = map[mode] || { icon: '?', label: mode, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`}>
      {p.icon} {p.label}
    </span>
  )
}

function paymentLabel(mode) {
  return { ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money', CARTE: 'Carte', CREDIT: 'Crédit' }[mode] || mode
}

function formatDateInput(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function money(value) {
  return `${(value || 0).toLocaleString('fr-FR')} F`
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ))
}

function openPrintableReport({ periode, dateJour, rapport, topProduits, inventaire }) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  const title = periode === 'jour'
    ? `Rapport journalier du ${formatDateInput(dateJour)}`
    : periode === 'semaine' ? 'Rapport des 7 derniers jours' : 'Rapport des 30 derniers jours'
  const ventesRows = periode === 'jour'
    ? (rapport.ventes || []).map(v => `<tr><td>${escapeHtml(v.numero)}</td><td>${new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td><td class="right">${money(v.total)}</td><td>${paymentLabel(v.modePaiement)}</td></tr>`).join('')
    : (rapport.parJour || []).map(row => `<tr><td>${formatDateInput(row.jour)}</td><td>${row.nb}</td><td class="right">${money(row.ca)}</td><td>—</td></tr>`).join('')
  const topRows = topProduits.map((p, i) => `<tr><td>${i + 1}. ${escapeHtml(p.nom)}</td><td>${p.quantiteVendue}</td><td class="right">${money(p.totalVente)}</td></tr>`).join('')
  const stockRows = (inventaire?.produits || []).filter(p => p.stockActuel > 0).slice(0, 20).map(p => `<tr><td>${escapeHtml(p.nom)}</td><td>${p.stockActuel}</td><td class="right">${money(p.stockActuel * p.prix)}</td></tr>`).join('')
  printWindow.document.write(`<html><head><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:14mm}body{margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif}main{max-width:210mm;margin:0 auto;background:#fff;padding:28px;box-sizing:border-box}h1{margin:0;font-size:24px}h2{margin:26px 0 10px;font-size:16px}.meta{margin-top:6px;color:#64748b;font-size:12px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.stat{border:1px solid #e2e8f0;border-radius:8px;padding:12px}.label{color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase}.value{margin-top:6px;font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc;color:#475569;font-size:11px;text-transform:uppercase}.right{text-align:right}@media print{body{background:#fff}main{padding:0}}</style></head><body><main><h1>${escapeHtml(title)}</h1><div class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</div><section class="stats"><div class="stat"><div class="label">Chiffre d'affaires</div><div class="value">${money(rapport.ca)}</div></div><div class="stat"><div class="label">Nombre de ventes</div><div class="value">${rapport.nbVentes || 0}</div></div><div class="stat"><div class="label">Panier moyen</div><div class="value">${money(rapport.nbVentes > 0 ? Math.round(rapport.ca / rapport.nbVentes) : 0)}</div></div></section><h2>${periode === 'jour' ? 'Ventes du jour' : 'Chiffres par jour'}</h2><table><thead><tr><th>${periode === 'jour' ? 'N°' : 'Jour'}</th><th>${periode === 'jour' ? 'Heure' : 'Ventes'}</th><th class="right">Total</th><th>Paiement</th></tr></thead><tbody>${ventesRows || '<tr><td colspan="4">Aucune donnée</td></tr>'}</tbody></table><h2>Top produits</h2><table><thead><tr><th>Produit</th><th>Qté</th><th class="right">Total</th></tr></thead><tbody>${topRows || '<tr><td colspan="3">Aucune donnée</td></tr>'}</tbody></table><h2>Inventaire visible</h2><table><thead><tr><th>Produit</th><th>Stock</th><th class="right">Valeur vente</th></tr></thead><tbody>${stockRows || '<tr><td colspan="3">Aucune donnée</td></tr>'}</tbody></table></main><script>window.onload=function(){window.focus();window.print()}<\/script></body></html>`)
  printWindow.document.close()
}
