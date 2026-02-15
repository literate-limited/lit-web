import { useState, useCallback, useEffect } from 'react';
import { lawApi } from '../api/lawApi.js';

/**
 * Hook for managing law search state and operations
 */
export function useLawSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    type: 'all',
    jurisdiction: null,
    yearFrom: null,
    yearTo: null,
    limit: 50,
    offset: 0
  });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (searchQuery, searchFilters = {}) => {
    if (!searchQuery?.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...searchFilters };
      const response = await lawApi.search(searchQuery, mergedFilters);

      setResults(response.results || []);
      setTotal(response.total || 0);
      setFacets(response.facets || {});
      setQuery(searchQuery);
      setFilters(mergedFilters);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilter = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      offset: 0 // Reset pagination on filter change
    }));
  }, []);

  const setPage = useCallback((page) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * filters.limit
    }));
  }, [filters.limit]);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      jurisdiction: null,
      yearFrom: null,
      yearTo: null,
      limit: 50,
      offset: 0
    });
    setResults([]);
    setTotal(0);
  }, []);

  return {
    query,
    setQuery,
    filters,
    updateFilter,
    results,
    total,
    facets,
    loading,
    error,
    search,
    setPage,
    resetFilters,
    currentPage: Math.floor(filters.offset / filters.limit) + 1
  };
}

/**
 * Hook for managing saved searches
 */
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await lawApi.listSavedSearches();
      setSavedSearches(response.searches || []);
    } catch (err) {
      console.error('Failed to list saved searches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (name, query, filters) => {
    try {
      const response = await lawApi.saveSavedSearch(name, query, filters);
      setSavedSearches(prev => [response, ...prev]);
      return response;
    } catch (err) {
      console.error('Failed to save search:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await lawApi.deleteSavedSearch(id);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete saved search:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const run = useCallback(async (id) => {
    try {
      const response = await lawApi.getSavedSearch(id);
      return response;
    } catch (err) {
      console.error('Failed to run saved search:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    list();
  }, [list]);

  return {
    savedSearches,
    loading,
    error,
    list,
    save,
    remove,
    run
  };
}
