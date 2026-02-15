/**
 * QUANTUM LAYOUT
 * Shared layout for quantum computing features
 *
 * "Structure gives form to chaos."
 * — Danton
 */

import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Atom, Zap, BookOpen, Trophy, Home } from 'lucide-react';

const QuantumLayout = () => {
  const navItems = [
    { to: '/quantum', icon: Zap, label: 'Playground', end: true },
    { to: '/quantum/tutorials', icon: BookOpen, label: 'Tutorials' },
    { to: '/quantum/progress', icon: Trophy, label: 'Progress' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <NavLink
              to="/quantum"
              className="flex items-center gap-3 text-xl font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              <Atom className="w-8 h-8" />
              <span>Quantum Lab</span>
            </NavLink>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {/* Home Link */}
              <NavLink
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ml-4"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by quantum simulation technology
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Educational mode • No real quantum hardware used
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Atom className="w-4 h-4" />
              <span>Built with passion by Danton</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuantumLayout;
