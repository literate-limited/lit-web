import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedSearches } from '../hooks/useLawSearch.js';
import styles from '../styles/lawlore.module.css';

export default function SavedSearchesPage() {
  const navigate = useNavigate();
  const { savedSearches, loading, error, remove, run } = useSavedSearches();
  const [runningId, setRunningId] = useState(null);

  const handleRun = async (search) => {
    setRunningId(search.id);
    try {
      await run(search.id);
      navigate(`/search/results?q=${encodeURIComponent(search.query)}&type=${search.filters?.type || 'all'}`);
    } catch (err) {
      console.error('Error running search:', err);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this saved search?')) {
      try {
        await remove(id);
      } catch (err) {
        console.error('Error deleting search:', err);
      }
    }
  };

  return (
    <div className={styles.container} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2rem' }}>
        Saved Searches
      </h1>

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: '#c00',
          marginBottom: '2rem'
        }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem' }}>Loading saved searches...</p>
        </div>
      )}

      {!loading && savedSearches.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateTitle}>No saved searches yet</div>
          <p>Create a new search and save it to keep track of your legal research</p>
        </div>
      )}

      {!loading && savedSearches.length > 0 && (
        <div className={styles.resultsList}>
          {savedSearches.map(search => (
            <div key={search.id} className={styles.resultItem}>
              <h3 className={styles.resultTitle}>{search.name}</h3>
              <div className={styles.resultMeta}>
                <span>Query: <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{search.query}</code></span>
                <span>{search.resultCount || 0} results</span>
                {search.lastRun && (
                  <span>Last run: {new Date(search.lastRun).toLocaleDateString()}</span>
                )}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleRun(search)}
                  disabled={runningId === search.id}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {runningId === search.id ? 'Running...' : 'Run Search'}
                </button>
                <button
                  onClick={() => handleDelete(search.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
