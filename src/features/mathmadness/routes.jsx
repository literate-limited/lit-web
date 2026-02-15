/**
 * Math Madness Routes
 *
 * Defines all routes for the Math Madness feature.
 */

import { lazy } from 'react';

// Lazy load all Math Madness components
const MathMadnessLayout = lazy(() => import('./MathMadnessLayout'));
const LitFunctionsPage = lazy(() => import('./pages/LitFunctionsPage'));
const LitFunctions3DPage = lazy(() => import('./pages/LitFunctions3DPage'));
const MaxwellEquationsPage = lazy(() => import('./pages/MaxwellEquationsPage'));
const ThermodynamicsPage = lazy(() => import('./pages/ThermodynamicsPage'));

export const mathMadnessRoutes = [
  {
    path: '/math-madness',
    element: <MathMadnessLayout />,
    children: [
      {
        index: true,
        element: <LitFunctionsPage />
      },
      {
        path: '3d',
        element: <LitFunctions3DPage />
      },
      {
        path: 'maxwell',
        element: <MaxwellEquationsPage />
      },
      {
        path: 'thermo',
        element: <ThermodynamicsPage />
      }
    ]
  }
];
