/**
 * TTV Header
 *
 * Top navigation bar for TeleprompTV with logo, credit balance, and user menu.
 */

import { Link } from 'react-router-dom';

export default function TTVHeader({ creditBalance, onToggleSidebar, onLogout }) {
  return (
    <header className="ttv-header">
      <div className="ttv-header-left">
        <button className="ttv-menu-toggle" onClick={onToggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link to="/ttv" className="ttv-logo">
          <span className="ttv-logo-icon">📹</span>
          <span className="ttv-logo-text">TeleprompTV</span>
        </Link>
      </div>

      <div className="ttv-header-right">
        {creditBalance !== null && (
          <div className="ttv-credit-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>{creditBalance} credits</span>
          </div>
        )}

        <button className="ttv-user-menu" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
