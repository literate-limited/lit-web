import { NavLink, Outlet } from 'react-router-dom';

export default function DebaticaLayout() {
  return (
    <div className="min-h-screen bg-[#140b22] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-extrabold tracking-wider">DEBATICA</div>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink to="/deb" className={({ isActive }) => `rounded-lg px-3 py-1.5 ${isActive ? 'bg-white text-black' : 'text-white/85 hover:bg-white/10'}`}>
              Library
            </NavLink>
            <NavLink to="/deb/history" className={({ isActive }) => `rounded-lg px-3 py-1.5 ${isActive ? 'bg-white text-black' : 'text-white/85 hover:bg-white/10'}`}>
              History
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
