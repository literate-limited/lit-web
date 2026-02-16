import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[GLOBAL] Error caught:', event.error);
  document.body.innerHTML = `<h1>Global JavaScript Error</h1><pre>${event.error?.toString()}</pre>`;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]:', event.reason);
  document.body.innerHTML = `<h1>Unhandled Promise Rejection</h1><pre>${event.reason?.toString()}</pre>`;
});

try {
  const root = document.getElementById('root');
  
  if (!root) {
    throw new Error('Root element not found in DOM');
  }
  
  console.log('[MAIN] Creating React root...');
  const reactRoot = ReactDOM.createRoot(root);
  
  console.log('[MAIN] Rendering App with ErrorBoundary...');
  reactRoot.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('[MAIN] Render complete');
} catch (error) {
  console.error('[MAIN] Fatal error:', error);
  document.body.innerHTML = `
    <h1>React Initialization Error</h1>
    <p style="color: red; font-family: monospace; white-space: pre-wrap;">
      ${error?.message || error?.toString()}
    </p>
    <details>
      <summary>Stack Trace</summary>
      <pre>${error?.stack}</pre>
    </details>
  `;
}
