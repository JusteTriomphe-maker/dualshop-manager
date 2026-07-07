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
    <div className="space-y-6">
      
      {/* Page Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Tableau de bord</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-light mt-1">Vue d'ensemble de l'activité commerciale en temps réel.</p>
        </div>

        {/* Boutique Select Card */}
        <div className="w-full sm:w-80 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/40 backdrop-blur-md flex items-center gap-3 shadow-sm dark:shadow-none">
          <div className="flex-1">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Sélection Boutique</label>
            <select
              value={boutiqueId}
              onChange={e => {
                const bId = e.target.value
                const bObj = boutiques.find(b => b.id === bId)
                setBoutique(bId, bObj?.type || '')
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg h-9 px-2.5 text-xs text-slate-900 dark:text-white outline-none transition focus:border-emerald-500/80"
            >
              <option value="">Sélectionner une boutique</option>
              {boutiques.map(b => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main content display conditional */}
      {boutiqueId && stats.jour ? (
        <div className="space-y-6">
          
          {/* Stats Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Aujourd'hui"
              value={`${stats.jour.ca.toLocaleString('fr-FR')} F`}
              meta={`${stats.jour.ventes} vente(s)`}
              tone="emerald"
            />
            <StatCard
              label="Cette semaine"
              value={`${stats.semaine.ca.toLocaleString('fr-FR')} F`}
              meta={`${stats.semaine.ventes} vente(s)`}
              tone="teal"
            />
            <StatCard
              label="Ce mois"
              value={`${stats.mois.ca.toLocaleString('fr-FR')} F`}
              meta={`${stats.mois.ventes} vente(s)`}
              tone="cyan"
            />
            <StatCard
              label="Panier moyen"
              value={`${panierMoyen.toLocaleString('fr-FR')} F`}
              meta="sur le mois courant"
              tone="amber"
            />
          </div>

          {/* Details Section */}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            
            {/* Left Box: Sales Synthesis */}
            <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/20 backdrop-blur-md p-5 sm:p-6 space-y-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Synthèse d'activité</h2>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Nombre total de ventes enregistrées.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Actif
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MiniMetric label="Aujourd'hui" value={stats.jour.ventes} subLabel="ventes complétées" />
                <MiniMetric label="Semaine" value={stats.semaine.ventes} subLabel="ventes complétées" />
                <MiniMetric label="Mois" value={stats.mois.ventes} subLabel="ventes complétées" />
              </div>
            </section>

            {/* Right Box: Operations Notice */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/20 backdrop-blur-md p-5 sm:p-6 flex flex-col justify-center space-y-4 shadow-sm dark:shadow-none">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Point d'attention</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed mt-1">
                  Les statistiques, les mouvements de stocks et les ventes hors-ligne se mettent automatiquement à jour selon la boutique courante sélectionnée ci-dessus.
                </p>
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-900/10 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm dark:shadow-none">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Aucune boutique active</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-light mt-1">Veuillez sélectionner une boutique dans le menu déroulant en haut à droite.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, meta, tone }) {
  const borderTones = {
    emerald: 'border-l-emerald-500 shadow-[0_4px_20px_rgba(52,211,153,0.03)]',
    teal: 'border-l-teal-500 shadow-[0_4px_20px_rgba(45,212,191,0.03)]',
    cyan: 'border-l-cyan-500 shadow-[0_4px_20px_rgba(34,211,238,0.03)]',
    amber: 'border-l-amber-500 shadow-[0_4px_20px_rgba(251,191,36,0.03)]',
  }
  
  const textTones = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    teal: 'text-teal-600 dark:text-teal-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md border-l-4 ${borderTones[tone]} transition hover:-translate-y-0.5 shadow-sm dark:shadow-none`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${textTones[tone]} font-mono`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-light">{meta}</p>
    </div>
  )
}

function MiniMetric({ label, value, subLabel }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/60 p-4 transition hover:bg-slate-100 dark:hover:bg-slate-950">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600 font-light">{subLabel}</p>
    </div>
  )
}
