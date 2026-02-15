/**
 * TTV Sidebar
 *
 * Navigation sidebar for TeleprompTV features.
 */

import { NavLink } from 'react-router-dom';

export default function TTVSidebar({ isOpen }) {
  const navItems = [
    { to: '/ttv', label: 'Dashboard', icon: '🏠', exact: true },
    { to: '/ttv/scripts', label: 'Scripts', icon: '📝' },
    { to: '/ttv/videos', label: 'Videos', icon: '🎬' },
    { to: '/ttv/film', label: 'Film Script', icon: '🎥' },
    { to: '/ttv/exports', label: 'Exports', icon: '⬇️' },
    { to: '/ttv/analytics', label: 'Analytics', icon: '📊' },
    { to: '/ttv/credits', label: 'Credits', icon: '💳' }
  ];

  return (
    <aside className={`ttv-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="ttv-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `ttv-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="ttv-nav-icon">{item.icon}</span>
            {isOpen && <span className="ttv-nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
