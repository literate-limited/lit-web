/**
 * PostgreSQL Visualizer
 *
 * Displays PostgreSQL tables and schema information
 * (Phase 1: Simple table list, Phase 2: ERD with React Flow)
 */

import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

export default function PostgreSQLVisualizer({ schema }) {
  const [expandedTable, setExpandedTable] = useState(null);

  if (!schema || !schema.tables) {
    return (
      <div className="p-6 text-center text-gray-500">
        No PostgreSQL data available
      </div>
    );
  }

  const { tables = [], stats = {} } = schema;

  return (
    <div className="p-4">
      {/* Statistics */}
      {stats.totalTables !== undefined && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Total Tables</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalTables}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Total Rows</p>
            <p className="text-2xl font-bold text-green-600">
              {(stats.totalRows || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Relationships</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.totalRelationships || 0}
            </p>
          </div>
        </div>
      )}

      {/* Tables List */}
      <div className="space-y-2">
        {tables.map((table) => (
          <div key={table.name} className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <button
              onClick={() =>
                setExpandedTable(
                  expandedTable === table.name ? null : table.name
                )
              }
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition bg-gray-100 border-b"
            >
              <div className="flex items-center gap-3 flex-1">
                {expandedTable === table.name ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{table.name}</p>
                  <p className="text-xs text-gray-500">
                    {table.columns?.length || 0} columns ·{' '}
                    {(table.rowCount || 0).toLocaleString()} rows
                  </p>
                </div>
              </div>
              {table.indexes && table.indexes.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {table.indexes.length} indexes
                </span>
              )}
            </button>

            {/* Table Details */}
            {expandedTable === table.name && (
              <div className="bg-white border-t">
                {/* Columns */}
                <div className="p-4 border-b">
                  <h4 className="font-semibold text-sm mb-3 text-gray-900">
                    Columns
                  </h4>
                  <div className="space-y-2">
                    {table.columns?.map((col) => (
                      <div
                        key={col.name}
                        className="flex justify-between items-start text-sm p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-mono text-gray-900">{col.name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {col.type}
                            {col.primaryKey && ' · PK'}
                            {col.unique && ' · UNIQUE'}
                            {!col.nullable && ' · NOT NULL'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indexes */}
                {table.indexes && table.indexes.length > 0 && (
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-sm mb-3 text-gray-900">
                      Indexes
                    </h4>
                    <div className="space-y-1">
                      {table.indexes.map((idx) => (
                        <p
                          key={idx.name}
                          className="text-xs text-gray-600 font-mono"
                        >
                          {idx.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No tables found</p>
        </div>
      )}
    </div>
  );
}
