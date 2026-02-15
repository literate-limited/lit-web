import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLawSearch } from '../hooks/useLawSearch.js';
import SearchFilters from '../components/SearchFilters.jsx';
import SearchResults from '../components/SearchResults.jsx';
import styles from '../styles/lawlore.module.css';

export default function LawloreSearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const jurisdiction = searchParams.get('jurisdiction') || null;
  const yearFrom = searchParams.get('year_from') ? parseInt(searchParams.get('year_from')) : null;
  const yearTo = searchParams.get('year_to') ? parseInt(searchParams.get('year_to')) : null;

  const {
    search,
    results,
    total,
    facets,
    loading,
    error,
    filters,
    updateFilter,
    currentPage,
    setPage
  } = useLawSearch(query);

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      search(query, {
        type,
        jurisdiction,
        yearFrom,
        yearTo,
        limit: 50,
        offset: 0
      });
      setHasSearched(true);
    }
  }, [query, type, jurisdiction, yearFrom, yearTo]);

  return (
    <div className={styles.container}>
      <div className={styles.gridContainer}>
        <SearchFilters facets={facets} filters={filters} onFilterChange={updateFilter} />
        <div className={styles.mainContent}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a' }}>
              Search Results
            </h1>
            {hasSearched && (
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                {loading ? 'Searching...' : `Found ${total} ${total === 1 ? 'result' : 'results'}`}
              </p>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '0.375rem',
              padding: '1rem',
              color: '#c00',
              marginBottom: '1.5rem'
            }}>
              Error: {error}
            </div>
          )}

          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.loadingSpinner}></div>
              <p style={{ marginTop: '1rem' }}>Searching...</p>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className={styles.emptyState}>
              <p>Enter a search query to get started</p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateTitle}>No results found</div>
              <p>Try adjusting your search terms or filters</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <SearchResults results={results} />
              {total > filters.limit && (
                <div className={styles.pagination}>
                  <button
                    className={styles.paginationButton}
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    currentPage + 2
                  ).map(page => (
                    <button
                      key={page}
                      className={`${styles.paginationButton} ${page === currentPage ? styles.active : ''}`}
                      onClick={() => setPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className={styles.paginationButton}
                    disabled={currentPage >= Math.ceil(total / filters.limit)}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
