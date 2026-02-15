/**
 * TeleprompTV Routes
 *
 * Defines all routes for the TTV brand.
 */

import { lazy } from 'react';

// Lazy load all TTV components
const TTVLayout = lazy(() => import('./layout/TTVLayout'));
const TelepromptTVPage = lazy(() => import('./pages/TelepromptTVPage'));
const ScriptsPage = lazy(() => import('./pages/ScriptsPage'));
const FilmScriptPage = lazy(() => import('./pages/FilmScriptPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));

export const ttvRoutes = [
  {
    path: '/ttv',
    element: <TTVLayout />,
    children: [
      {
        index: true,
        element: <TelepromptTVPage />
      },
      {
        path: 'scripts',
        element: <ScriptsPage />
      },
      {
        path: 'scripts/:id',
        element: <FilmScriptPage />
      },
      {
        path: 'videos',
        element: <VideosPage />
      },
      {
        path: 'credits',
        element: <CreditsPage />
      },
      {
        path: 'film',
        element: <FilmScriptPage />
      }
    ]
  }
];
