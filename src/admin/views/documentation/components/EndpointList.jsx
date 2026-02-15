/**
 * Endpoint List
 *
 * Searchable, filterable list of API endpoints
 */

import { useState, useMemo } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import EndpointCard from './EndpointCard';

export default function EndpointList({
  endpoints,
  selectedEndpoint,
  onSelect
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterDomain, setFilterDomain] = useState('ALL');

  // Extract unique domains
  const domains = useMemo(() => {
    const uniqueDomains = [...new Set(endpoints.map((ep) => ep.domain))];
    return ['ALL', ...uniqueDomains.sort()];
  }, [endpoints]);

  // Filter endpoints
  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch = !searchTerm ||
        ep.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod =
        filterMethod === 'ALL' || ep.methods.includes(filterMethod);
      const matchesDomain =
        filterDomain === 'ALL' || ep.domain === filterDomain;

      return matchesSearch && matchesMethod && matchesDomain;
    });
  }, [endpoints, searchTerm, filterMethod, filterDomain]);

  return (
    <div className="h-full flex flex-col">
      {/* Search & Filter */}
      <div className="border-b p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain === 'ALL' ? 'All Domains' : domain}
              </option>
            ))}
          </select>
        </div>

        {/* Count */}
        <p className="text-xs text-gray-600">
          {filtered.length} of {endpoints.length} endpoints
        </p>
      </div>

      {/* Endpoints */}
      <div className="flex-1 overflow-auto">
        {filtered.length > 0 ? (
          <div className="space-y-1 p-2">
            {filtered.map((endpoint) => (
              <EndpointCard
                key={endpoint.path + endpoint.methods.join()}
                endpoint={endpoint}
                isSelected={
                  selectedEndpoint?.path === endpoint.path &&
                  selectedEndpoint?.methods.join() === endpoint.methods.join()
                }
                onClick={() => onSelect(endpoint)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No endpoints found
          </div>
        )}
      </div>
    </div>
  );
}
