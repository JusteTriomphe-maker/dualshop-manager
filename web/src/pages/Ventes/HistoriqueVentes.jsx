import { useEffect, useState } from 'react'
import api from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function HistoriqueVentes() {
  const [ventes, setVentes] = useState([])
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [totalPeriode, setTotalPeriode] = useState(0)
  const boutiqueId = useAuthStore(s => s.boutiqueId)

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
    const day = new Date(v.createdAt).toLocaleDateString('fr-CG', { timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', year: 'numeric' })
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des ventes</h1>
          <p className="page-subtitle">Chiffre d'affaires, paiements et statut des ventes par journée.</p>
        </div>
        <div className="stat-card w-full sm:w-72">
          <p className="stat-label">Total période</p>
          <p className="stat-value">{totalPeriode.toLocaleString('fr-FR')} F</p>
          <p className="stat-meta">{ventes.length} vente(s)</p>
        </div>
      </div>

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
        <button onClick={() => { setDateDebut(''); setDateFin('') }} className="btn btn-secondary">
          Réinitialiser
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="empty-state">Aucune vente trouvée.</div>
      ) : (
        <div className="space-y-5">
          {sortedDays.map(([day, group]) => (
            <section key={day} className="panel overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">{day}</h2>
                <span className="text-lg font-semibold">{group.total.toLocaleString('fr-FR')} F</span>
              </div>

              <div className="hidden md:block">
                <div className="table-scroll">
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
                      </tr>
                    </thead>
                    <tbody>
                      {group.ventes.map(v => (
                        <tr key={v.id}>
                          <td className="font-mono font-semibold text-slate-950">{v.numero}</td>
                          <td>{new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{v.boutique?.nom}</td>
                          <td>{v.caissier?.nom}</td>
                          <td>{v.numeroTable || '-'}</td>
                          <td>{v.client?.nom || '-'}</td>
                          <td className="font-semibold text-slate-950">{v.total.toLocaleString('fr-FR')} F</td>
                          <td>{paymentLabel(v.modePaiement)}</td>
                          <td><SaleStatus statut={v.statut} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {group.ventes.map(v => (
                  <article key={v.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-semibold text-slate-950">{v.numero}</p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(v.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <SaleStatus statut={v.statut} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Info label="Total" value={`${v.total.toLocaleString('fr-FR')} F`} strong />
                      <Info label="Paiement" value={paymentLabel(v.modePaiement)} />
                      <Info label="Caissier" value={v.caissier?.nom || '-'} />
                      <Info label="Client" value={v.client?.nom || '-'} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function SaleStatus({ statut }) {
  if (statut === 'COMPLETEE') return <span className="badge badge-success">Complétée</span>
  if (statut === 'ANNULEE') return <span className="badge badge-danger">Annulée</span>
  return <span className="badge badge-warning">{statut}</span>
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

function Info({ label, value, strong = false }) {
  return (
    <div className="rounded-lg bg-stone-50 p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate ${strong ? 'font-semibold text-slate-950' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}
