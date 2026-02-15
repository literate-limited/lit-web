/**
 * TTV Layout
 *
 * Main layout wrapper for all TeleprompTV pages.
 * Includes header, sidebar navigation, and main content area.
 */

import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TTVHeader from './TTVHeader';
import TTVSidebar from './TTVSidebar';
import { credits } from '../api';
import './ttvTheme.css';

export default function TTVLayout() {
  const [creditBalance, setCreditBalance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Load credit balance
  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const result = await credits.getBalance();
      setCreditBalance(result.balance);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="ttv-layout">
      <TTVHeader
        creditBalance={creditBalance}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="ttv-content-wrapper">
        <TTVSidebar isOpen={sidebarOpen} />

        <main className={`ttv-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Outlet context={{ creditBalance, refreshCredits: loadCredits }} />
        </main>
      </div>
    </div>
  );
}
