import { useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function RapportJournalier() {
  const [periode, setPeriode] = useState('jour')
  const [rapport, setRapport] = useState(null)
  const [topProduits, setTopProduits] = useState([])
  const [inventaire, setInventaire] = useState(null)
  const boutiqueId = useAuthStore(s => s.boutiqueId)

  useEffect(() => {
    if (!boutiqueId) return
    if (periode === 'jour') {
      api.get('/rapports/ca-journalier', { params: { boutiqueId } }).then(res => setRapport(res.data)).catch(() => {})
    } else if (periode === 'semaine' || periode === 'mois') {
      const debut = new Date()
      if (periode === 'semaine') debut.setDate(debut.getDate() - 7)
      else debut.setMonth(debut.getMonth() - 1)
      api.get('/rapports/ca-periode', { params: { boutiqueId, debut: debut.toISOString() } }).then(res => setRapport(res.data)).catch(() => {})
    }
    api.get('/rapports/top-produits', { params: { boutiqueId, periode: periode === 'mois' ? '30j' : '7j' } }).then(res => setTopProduits(res.data)).catch(() => {})
    api.get('/rapports/inventaire', { params: { boutiqueId } }).then(res => setInventaire(res.data)).catch(() => {})
  }, [boutiqueId, periode])

  const panierMoyen = rapport?.nbVentes > 0 ? Math.round(rapport.ca / rapport.nbVentes) : 0

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Indicateurs de vente, top produits et aperçu inventaire.</p>
        </div>
        <div className="w-full sm:w-60">
          <label className="field-label">Période</label>
          <select value={periode} onChange={e => setPeriode(e.target.value)} className="select-control">
            <option value="jour">Aujourd'hui</option>
            <option value="semaine">7 derniers jours</option>
            <option value="mois">30 derniers jours</option>
          </select>
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
