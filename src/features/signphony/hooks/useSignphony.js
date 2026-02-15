/**
 * Signphony Hook
 * Main hook for accessing signphony state and methods
 */

import { useState, useEffect } from 'react';
import { signphonyApi } from '../api/client';

export function useSignphony() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch system status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await signphonyApi.status();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check health
  const checkHealth = async () => {
    try {
      const data = await signphonyApi.health();
      return data.status === 'healthy';
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    error,
    fetchStatus,
    checkHealth,
    api: signphonyApi,
  };
}

export default useSignphony;
