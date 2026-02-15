/**
 * Signphony Feature
 * Sign language learning platform integrated into lit
 */

export { default as SignphonyLanding } from './pages/SignphonyLanding';
export { default as SignLearningGame } from './pages/SignLearningGame';
export { default as MagicTricks } from './pages/MagicTricks';
export { default as AuslanTranslator } from './pages/AuslanTranslator';
export { default as SignphonyDashboard } from './pages/SignphonyDashboard';

// API client
export { signphonyApi } from './api/client';

// Hooks
export { useSignphony } from './hooks/useSignphony';
export { useWebSocket } from './hooks/useWebSocket';
