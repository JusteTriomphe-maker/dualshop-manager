import { useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

const todayInput = () => new Date().toISOString().slice(0, 10)

export default function RapportJournalier() {
  const [periode, setPeriode] = useState('jour')
  const [dateJour, setDateJour] = useState(todayInput())
  const [rapport, setRapport] = useState(null)
  const [topProduits, setTopProduits] = useState([])
  const [inventaire, setInventaire] = useState(null)
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  useEffect(() => {
    if (!boutiqueId) return
    setRapport(null)

    if (periode === 'jour') {
      api.get('/rapports/ca-journalier', { params: { boutiqueId, date: dateJour } }).then(res => setRapport(res.data)).catch(() => {})
    } else if (periode === 'semaine' || periode === 'mois') {
      const debut = new Date()
      if (periode === 'semaine') debut.setDate(debut.getDate() - 7)
      else debut.setMonth(debut.getMonth() - 1)
      api.get('/rapports/ca-periode', { params: { boutiqueId, debut: debut.toISOString() } }).then(res => setRapport(res.data)).catch(() => {})
    }

    api.get('/rapports/top-produits', { params: { boutiqueId, periode: periode === 'mois' ? '30j' : '7j' } }).then(res => setTopProduits(res.data)).catch(() => {})
    api.get('/rapports/inventaire', { params: { boutiqueId } }).then(res => setInventaire(res.data)).catch(() => {})
  }, [boutiqueId, periode, dateJour])

  const panierMoyen = rapport?.nbVentes > 0 ? Math.round(rapport.ca / rapport.nbVentes) : 0

  const handlePrintReport = () => {
    if (!rapport) return
    openPrintableReport({ periode, dateJour, rapport, topProduits, inventaire })
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Chiffres journaliers, ventes détaillées, top produits et aperçu inventaire.</p>
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[12rem_11rem_auto] sm:items-end">
          <div>
            <label className="field-label">Période</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)} className="select-control">
              <option value="jour">Journalier</option>
              <option value="semaine">7 derniers jours</option>
              <option value="mois">30 derniers jours</option>
            </select>
          </div>
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              value={dateJour}
              onChange={e => setDateJour(e.target.value)}
              className="input-control"
              disabled={periode !== 'jour'}
            />
          </div>
          <button onClick={handlePrintReport} disabled={!rapport} className="btn btn-secondary">
            Voir / PDF
          </button>
        </div>
      </div>

      {!boutiqueId && <div className="empty-state">Sélectionnez une boutique pour afficher les rapports.</div>}

      {rapport && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="stat-card border-l-4 border-l-teal-600">
            <p className="stat-label">Chiffre d'affaires</p>
            <p className="stat-value">{rapport.ca?.toLocaleString('fr-FR')} F</p>
          </div>
          <div className="stat-card border-l-4 border-l-sky-600">
            <p className="stat-label">Nombre de ventes</p>
            <p className="stat-value">{rapport.nbVentes}</p>
          </div>
          <div className="stat-card border-l-4 border-l-amber-500">
            <p className="stat-label">Panier moyen</p>
            <p className="stat-value">{panierMoyen.toLocaleString('fr-FR')} F</p>
          </div>
        </div>
      )}

      {periode === 'jour' && rapport?.ventes && (
        <section className="panel">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Ventes du jour</h2>
            <p className="text-sm text-slate-500">{formatDateInput(dateJour)}</p>
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
                    <td className="font-mono font-semibold text-slate-950">{v.numero}</td>
                    <td>{new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="font-semibold text-slate-950">{v.total.toLocaleString('fr-FR')} F</td>
                    <td>{paymentLabel(v.modePaiement)}</td>
                  </tr>
                ))}
                {rapport.ventes.length === 0 && <tr><td colSpan="4" className="text-center text-slate-500">Aucune vente</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {periode !== 'jour' && rapport?.parJour && (
        <section className="panel">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Chiffres par jour</h2>
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
                    <td className="font-semibold text-slate-950">{formatDateInput(row.jour)}</td>
                    <td>{row.nb}</td>
                    <td className="font-semibold text-slate-950">{row.ca.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
                {rapport.parJour.length === 0 && <tr><td colSpan="3" className="text-center text-slate-500">Aucune donnée</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="panel">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Top produits</h2>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté vendue</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {topProduits.map((p, i) => (
                  <tr key={p.produitId}>
                    <td className="font-semibold text-slate-950">{i + 1}. {p.nom}</td>
                    <td>{p.quantiteVendue}</td>
                    <td className="font-semibold text-slate-950">{p.totalVente?.toLocaleString('fr-FR')} F</td>
                  </tr>
                ))}
                {topProduits.length === 0 && <tr><td colSpan="3" className="text-center text-slate-500">Aucune donnée</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Inventaire</h2>
          </div>
          {inventaire ? (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-stone-50 p-3">
                  <p className="stat-label">Valeur stock achat</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{inventaire.valeurStock?.toLocaleString('fr-FR')} F</p>
                </div>
                <div className="rounded-lg bg-stone-50 p-3">
                  <p className="stat-label">Valeur stock vente</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{inventaire.valeurVente?.toLocaleString('fr-FR')} F</p>
                </div>
              </div>

              <div className="mt-4 table-scroll rounded-lg border border-slate-200">
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
                        <td className="font-semibold text-slate-950">{p.nom}</td>
                        <td>{p.stockActuel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="empty-state">Aucune donnée d'inventaire</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function openPrintableReport({ periode, dateJour, rapport, topProduits, inventaire }) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const title = periode === 'jour'
    ? `Rapport journalier du ${formatDateInput(dateJour)}`
    : periode === 'semaine'
      ? 'Rapport des 7 derniers jours'
      : 'Rapport des 30 derniers jours'

  const ventesRows = periode === 'jour'
    ? (rapport.ventes || []).map(v => `
        <tr>
          <td>${escapeHtml(v.numero)}</td>
          <td>${new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
          <td class="right">${money(v.total)}</td>
          <td>${paymentLabel(v.modePaiement)}</td>
        </tr>
      `).join('')
    : (rapport.parJour || []).map(row => `
        <tr>
          <td>${formatDateInput(row.jour)}</td>
          <td>${row.nb}</td>
          <td class="right">${money(row.ca)}</td>
          <td>-</td>
        </tr>
      `).join('')

  const topRows = topProduits.map((p, i) => `
    <tr>
      <td>${i + 1}. ${escapeHtml(p.nom)}</td>
      <td>${p.quantiteVendue}</td>
      <td class="right">${money(p.totalVente)}</td>
    </tr>
  `).join('')

  const stockRows = (inventaire?.produits || []).filter(p => p.stockActuel > 0).slice(0, 20).map(p => `
    <tr>
      <td>${escapeHtml(p.nom)}</td>
      <td>${p.stockActuel}</td>
      <td class="right">${money(p.stockActuel * p.prix)}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
          main { max-width: 210mm; margin: 0 auto; background: #fff; padding: 28px; box-sizing: border-box; }
          h1 { margin: 0; font-size: 24px; }
          h2 { margin: 26px 0 10px; font-size: 16px; }
          .meta { margin-top: 6px; color: #64748b; font-size: 12px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
          .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .label { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .value { margin-top: 6px; font-size: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; }
          .right { text-align: right; }
          @media print {
            body { background: #fff; }
            main { padding: 0; }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</div>

          <section class="stats">
            <div class="stat"><div class="label">Chiffre d'affaires</div><div class="value">${money(rapport.ca)}</div></div>
            <div class="stat"><div class="label">Nombre de ventes</div><div class="value">${rapport.nbVentes || 0}</div></div>
            <div class="stat"><div class="label">Panier moyen</div><div class="value">${money(rapport.nbVentes > 0 ? Math.round(rapport.ca / rapport.nbVentes) : 0)}</div></div>
          </section>

          <h2>${periode === 'jour' ? 'Ventes du jour' : 'Chiffres par jour'}</h2>
          <table>
            <thead><tr><th>${periode === 'jour' ? 'N°' : 'Jour'}</th><th>${periode === 'jour' ? 'Heure' : 'Ventes'}</th><th class="right">Total</th><th>Paiement</th></tr></thead>
            <tbody>${ventesRows || '<tr><td colspan="4">Aucune donnée</td></tr>'}</tbody>
          </table>

          <h2>Top produits</h2>
          <table>
            <thead><tr><th>Produit</th><th>Qté</th><th class="right">Total</th></tr></thead>
            <tbody>${topRows || '<tr><td colspan="3">Aucune donnée</td></tr>'}</tbody>
          </table>

          <h2>Inventaire visible</h2>
          <table>
            <thead><tr><th>Produit</th><th>Stock</th><th class="right">Valeur vente</th></tr></thead>
            <tbody>${stockRows || '<tr><td colspan="3">Aucune donnée</td></tr>'}</tbody>
          </table>
        </main>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

function paymentLabel(mode) {
  const labels = {
    ESPECES: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
    CARTE: 'Carte',
    CREDIT: 'Crédit',
  }
  return labels[mode] || mode
}

function formatDateInput(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function money(value) {
  return `${(value || 0).toLocaleString('fr-FR')} F`
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}
