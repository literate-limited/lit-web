import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={cn(styles.toast, styles[t.type])} role="status">
          <div className={styles.message}>{t.message}</div>
          <button className={styles.close} onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ type = 'info', message, duration = 3200 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [{ id, type, message }, ...prev].slice(0, 4));
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      info: (message, opts) => push({ type: 'info', message, ...(opts || {}) }),
      success: (message, opts) => push({ type: 'success', message, ...(opts || {}) }),
      error: (message, opts) => push({ type: 'error', message, duration: 5000, ...(opts || {}) }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

