/**
 * APIs Tab
 *
 * Shows API endpoint catalog with:
 * - Endpoint list with search/filter
 * - Endpoint details
 * - Export options
 */

import { useState, useEffect } from 'react';
import EndpointList from './components/EndpointList';
import EndpointDetailPanel from './components/EndpointDetailPanel';

export default function APIsTab() {
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const response = await fetch('/api/v2/admin/documentation/apis');
        if (!response.ok) {
          throw new Error('Failed to fetch endpoints');
        }
        const data = await response.json();
        setEndpoints(data.endpoints || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching endpoints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoints();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading API endpoints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-bold mb-2">Error Loading APIs</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Endpoint List */}
      <div className="w-1/3 border-r bg-white overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4">
          <h3 className="font-bold mb-2">API Endpoints</h3>
          <p className="text-xs text-gray-500">{endpoints.length} total</p>
        </div>
        <EndpointList
          endpoints={endpoints}
          selectedEndpoint={selectedEndpoint}
          onSelect={setSelectedEndpoint}
        />
      </div>

      {/* Endpoint Details */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <EndpointDetailPanel endpoint={selectedEndpoint} />
      </div>
    </div>
  );
}
