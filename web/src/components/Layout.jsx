import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const navItems = [
  { path: '/', label: 'Tableau de bord', roles: ['DG', 'GERANT', 'CAISSIER'], icon: 'grid' },
  { path: '/ventes/nouvelle', label: 'Vente', roles: ['DG', 'GERANT', 'CAISSIER'], icon: 'sale' },
  { path: '/stock', label: 'Stock', roles: ['DG', 'GERANT'], icon: 'stock' },
  { path: '/rapports', label: 'Rapports', roles: ['DG', 'GERANT'], icon: 'rapport' },
  { path: '/dettes', label: 'Dettes', roles: ['DG', 'GERANT'], icon: 'dette' },
  { path: '/contacts', label: 'Contacts', roles: ['DG', 'GERANT'], icon: 'contact' },
  { path: '/admin/users', label: 'Utilisateurs', roles: ['DG'], icon: 'user' },
]

function getIcon(name) {
  const mapping = {
    grid: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    sale: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    stock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    rapport: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    dette: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    contact: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    user: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }
  return mapping[name] || null
}

export default function Layout({ children }) {
  const { user, logout, boutiqueId } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const boutiqueNom = boutiqueId === 'boutique-epicerie' ? 'Épicerie' : boutiqueId === 'boutique-restaubar' ? 'Restau-bar' : ''
  const visibleItems = navItems.filter(item => item.roles.includes(user?.role) && !(user?.role === 'CAISSIER' && item.path === '/'))
  const currentPage = visibleItems.find(item => item.path === location.pathname)?.label || 'DualShop'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavContent = ({ onNavigate }) => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      
      {/* Sidebar Header Logo */}
      <div className="border-b border-slate-900 p-5 flex items-center gap-3">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(52,211,153,0.25)] text-slate-950 font-extrabold text-lg transition group-hover:scale-105">
            DS
          </span>
          <div>
            <p className="text-base font-extrabold tracking-tight text-white">DualShop</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/90 -mt-0.5">Manager</p>
          </div>
        </Link>
      </div>

      {/* User profile card */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          {/* Subtle background glow */}
          <div className="absolute right-[-10%] top-[-10%] w-12 h-12 rounded-full bg-emerald-500/10 blur-md" />
          
          <p className="truncate text-sm font-semibold text-white">{user?.nom}</p>
          <p className="truncate text-xs text-slate-500 font-light mt-0.5">{user?.email}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
              {user?.role}
            </span>
            {boutiqueNom && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {boutiqueNom}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 px-3 pb-4 overflow-y-auto">
        {visibleItems.map(item => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition group ${
                active
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.15)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className={active ? 'text-slate-950' : 'text-slate-500 group-hover:text-emerald-400 transition'}>
                {getIcon(item.icon)}
              </span>
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout button */}
      <div className="border-t border-slate-900 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 lg:flex transition-colors duration-200">
      
      {/* Desktop sidebar */}
      <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-slate-200 dark:border-slate-900 bg-slate-950 lg:flex">
        <NavContent />
      </aside>

      {/* Mobile sidebar (Drawer) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-slate-900 bg-slate-950 shadow-2xl">
            <NavContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content wrapper */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen relative">
        
        {/* Background glow for the content area */}
        <div className="absolute right-0 top-0 w-[40%] h-[30%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 lg:hidden"
                onClick={() => setMenuOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white tracking-tight">{currentPage}</p>
                <p className="truncate text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                  {boutiqueNom || 'Aucune boutique sélectionnée'}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-4">
              
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {theme === 'dark' ? (
                  // Sun Icon
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  // Moon Icon
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                  {user?.role}
                </span>
                {boutiqueNom && (
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {boutiqueNom}
                  </span>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* Content container */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
