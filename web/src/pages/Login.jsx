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
    <div className="grid min-h-screen bg-stone-50 lg:grid-cols-[1fr_28rem]">
      <section className="hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950">
              DS
            </span>
            <div>
              <p className="text-lg font-semibold">DualShop</p>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Manager</p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <h1 className="text-4xl font-semibold tracking-normal">Gestion commerciale claire et rapide.</h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Épicerie, restau-bar, ventes, stocks, dettes et rapports réunis dans un espace de travail net.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['Ventes', 'Stock', 'Rapports'].map(item => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">{item}</p>
              <p className="mt-1 text-xs text-slate-400">DualShop</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="panel w-full max-w-md p-5 sm:p-6">
          <div className="mb-7">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                DS
              </span>
              <div>
                <p className="font-semibold text-slate-950">DualShop</p>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Manager</p>
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">Connexion</h2>
            <p className="mt-1 text-sm text-slate-500">Entrez vos identifiants pour continuer.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-control"
                placeholder="dg@dualshop.com"
                required
              />
            </div>

            <div>
              <label className="field-label">Mot de passe</label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-control"
                  placeholder="********"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn btn-secondary shrink-0">
                  {showPassword ? 'Masquer' : 'Voir'}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-6 w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </main>
    </div>
  )
}
