import { useEffect, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const [boutiques, setBoutiques] = useState([])
  const [stats, setStats] = useState({})
  const boutiqueId = useAuthStore(s => s.boutiqueId)
  const setBoutique = useAuthStore(s => s.setBoutique)

  useEffect(() => {
    api.get('/boutiques').then(res => setBoutiques(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (boutiqueId) {
      api.get(`/boutiques/${boutiqueId}/stats`).then(res => setStats(res.data)).catch(() => {})
    }
  }, [boutiqueId])

  const panierMoyen = stats.mois?.ventes > 0 ? Math.round(stats.mois.ca / stats.mois.ventes) : 0

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue rapide de l'activité commerciale par boutique.</p>
        </div>

        <div className="w-full sm:w-72">
          <label className="field-label">Boutique</label>
          <select
            value={boutiqueId}
            onChange={e => {
              const bId = e.target.value
              const bObj = boutiques.find(b => b.id === bId)
              setBoutique(bId, bObj?.type || '')
            }}
            className="select-control"
          >
            <option value="">Sélectionner une boutique</option>
            {boutiques.map(b => (
              <option key={b.id} value={b.id}>{b.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {boutiqueId && stats.jour ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Aujourd'hui" value={`${stats.jour.ca.toLocaleString('fr-FR')} F`} meta={`${stats.jour.ventes} vente(s)`} tone="teal" />
            <StatCard label="Cette semaine" value={`${stats.semaine.ca.toLocaleString('fr-FR')} F`} meta={`${stats.semaine.ventes} vente(s)`} tone="sky" />
            <StatCard label="Ce mois" value={`${stats.mois.ca.toLocaleString('fr-FR')} F`} meta={`${stats.mois.ventes} vente(s)`} tone="slate" />
            <StatCard label="Panier moyen" value={`${panierMoyen.toLocaleString('fr-FR')} F`} meta="sur le mois" tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="panel panel-pad">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Synthèse</h2>
                  <p className="text-sm text-slate-500">Performance de la boutique sélectionnée.</p>
                </div>
                <span className="badge badge-success">Actif</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Jour" value={stats.jour.ventes} />
                <MiniMetric label="Semaine" value={stats.semaine.ventes} />
                <MiniMetric label="Mois" value={stats.mois.ventes} />
              </div>
            </section>

            <section className="panel panel-pad">
              <h2 className="text-lg font-semibold text-slate-950">Point d'attention</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Les ventes et les mouvements de stock se mettent à jour selon la boutique courante.
              </p>
            </section>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Sélectionnez une boutique pour afficher les indicateurs.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, meta, tone }) {
  const tones = {
    teal: 'border-l-teal-600',
    sky: 'border-l-sky-600',
    slate: 'border-l-slate-700',
    amber: 'border-l-amber-500',
  }

  return (
    <div className={`stat-card border-l-4 ${tones[tone]}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-meta">{meta}</p>
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-stone-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}
