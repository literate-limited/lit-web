/**
 * Data Tab
 *
 * Shows database visualization with:
 * - PostgreSQL schema explorer
 * - Migration status
 */

import { useState, useEffect } from 'react';
import DatabaseLayout from './components/DatabaseLayout';
import PostgreSQLVisualizer from './components/PostgreSQLVisualizer';
import MigrationProgress from './components/MigrationProgress';

export default function DataTab() {
  const [sqlSchema, setSqlSchema] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const safeParseJson = async (response, endpoint) => {
    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn(`${endpoint} returned non-JSON (${contentType}):`, text.substring(0, 200));
        return null;
      }
      return await response.json();
    } catch (err) {
      console.warn(`Failed to parse JSON from ${endpoint}:`, err.message);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sqlRes, migrationRes] = await Promise.all([
        fetch('/api/v2/admin/documentation/database/sql'),
        fetch('/api/v2/admin/documentation/database/migration-status')
      ]);

      // SQL is required to succeed
      if (!sqlRes.ok) {
        throw new Error(`Failed to fetch PostgreSQL schema (${sqlRes.status})`);
      }

      // Parse responses safely (may return null if not JSON)
      const sqlData = await safeParseJson(sqlRes, '/database/sql');
      const migrationData = migrationRes.ok ? await safeParseJson(migrationRes, '/database/migration-status') : null;

      if (!sqlData) {
        throw new Error('PostgreSQL schema response was not valid JSON');
      }

      setSqlSchema(sqlData);
      setMigrationStatus(migrationData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading database schemas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-bold mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Database Architecture</h2>
            <p className="text-gray-600 mt-1">
              PostgreSQL schema explorer
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-2">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Migration Status */}
      {migrationStatus && (
        <div className="px-6 pt-6">
          <MigrationProgress status={migrationStatus} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <DatabaseLayout>
          {sqlSchema && (
            <div>
              <div className="mb-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                PRIMARY
              </div>
              <PostgreSQLVisualizer schema={sqlSchema} />
            </div>
          )}
        </DatabaseLayout>
      </div>
    </div>
  );
}
