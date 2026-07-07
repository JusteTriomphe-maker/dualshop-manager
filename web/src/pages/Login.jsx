import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center overflow-hidden font-sans">
      
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Presentation */}
        <section className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-8 text-center lg:text-left">
          
          {/* Logo Section */}
          <div className="flex items-center justify-center lg:justify-start gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] text-slate-950 font-extrabold text-xl tracking-tight">
              DS
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DualShop
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90 -mt-0.5">
                Manager Dashboard
              </p>
            </div>
          </div>

          {/* Heading Description */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Gérez votre commerce <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                en toute simplicité.
              </span>
            </h1>
            <p className="text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Épicerie, restau-bar, ventes, stocks, dettes et rapports de performance réunis dans un espace de travail fluide et réactif.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto lg:mx-0">
            {[
              {
                title: 'Suivi des Ventes',
                desc: 'Enregistrement instantané',
                icon: (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: 'Contrôle des Stocks',
                desc: 'Alertes de seuils bas',
                icon: (
                  <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
              {
                title: 'Rapports Précis',
                desc: 'Synthèses journalières',
                icon: (
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                )
              }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 backdrop-blur-md hover:border-slate-700/60 transition group hover:-translate-y-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 group-hover:bg-slate-950 transition">
                  {f.icon}
                </div>
                <p className="mt-3 font-semibold text-sm text-slate-200">{f.title}</p>
                <p className="mt-1 text-xs text-slate-500 font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Glassmorphic Form Card */}
        <main className="lg:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-850/70 border border-slate-750/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Connexion</h2>
              <p className="text-sm text-slate-400 font-light">Saisissez vos identifiants pour accéder au tableau de bord.</p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="flex gap-2.5 items-center p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-medium animate-shake">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Adresse Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-700/60 bg-slate-900/60 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/80 focus:ring-4 focus:ring-emerald-400/5 focus:bg-slate-900"
                    placeholder="dg@dualshop.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-700/60 bg-slate-900/60 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/80 focus:ring-4 focus:ring-emerald-400/5 focus:bg-slate-900"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Style overrides for custom properties */}
      <style>{`
        .bg-slate-850\\/70 {
          background-color: rgba(22, 30, 49, 0.7);
        }
        .border-slate-750\\/80 {
          border-color: rgba(38, 50, 77, 0.8);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}
