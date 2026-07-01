import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const navItems = [
  { path: '/', label: 'Tableau de bord', roles: ['DG', 'GERANT', 'CAISSIER'] },
  { path: '/ventes/nouvelle', label: 'Vente', roles: ['DG', 'GERANT', 'CAISSIER'] },
  { path: '/stock', label: 'Stock', roles: ['DG', 'GERANT'] },
  { path: '/rapports', label: 'Rapports', roles: ['DG', 'GERANT'] },
  { path: '/dettes', label: 'Dettes', roles: ['DG', 'GERANT'] },
  { path: '/contacts', label: 'Contacts', roles: ['DG', 'GERANT'] },
  { path: '/admin/users', label: 'Utilisateurs', roles: ['DG'] },
]

export default function Layout({ children }) {
  const { user, logout, boutiqueId } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const boutiqueNom = boutiqueId === 'boutique-epicerie' ? 'Épicerie' : boutiqueId === 'boutique-restaubar' ? 'Restau-bar' : ''
  const visibleItems = navItems.filter(item => item.roles.includes(user?.role) && !(user?.role === 'CAISSIER' && item.path === '/'))
  const currentPage = visibleItems.find(item => item.path === location.pathname)?.label || 'DualShop'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavContent = ({ onNavigate }) => (
    <>
      <div className="border-b border-slate-200 p-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
            DS
          </span>
          <div>
            <p className="text-base font-semibold text-slate-950">DualShop</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Manager</p>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="rounded-lg border border-slate-200 bg-stone-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-950">{user?.nom}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="badge badge-neutral">{user?.role}</span>
            {boutiqueNom && <span className="badge badge-info">{boutiqueNom}</span>}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {visibleItems.map(item => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`app-nav-link ${
                active
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <span>{item.label}</span>
              {active && <span className="h-2 w-2 rounded-full bg-teal-300" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button onClick={handleLogout} className="btn btn-secondary w-full">
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <NavContent />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-slate-200 bg-white shadow-xl">
            <NavContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:static">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" className="btn btn-secondary btn-sm lg:hidden" onClick={() => setMenuOpen(true)}>
                Menu
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{currentPage}</p>
                <p className="truncate text-xs text-slate-500">{boutiqueNom || 'Aucune boutique sélectionnée'}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="badge badge-neutral">{user?.role}</span>
              {boutiqueNom && <span className="badge badge-info">{boutiqueNom}</span>}
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}
