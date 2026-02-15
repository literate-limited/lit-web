/**
 * Endpoint Card
 *
 * Individual endpoint summary card
 */

const methodColors = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-purple-100 text-purple-800',
  DELETE: 'bg-red-100 text-red-800',
  HEAD: 'bg-gray-100 text-gray-800',
  OPTIONS: 'bg-gray-100 text-gray-800'
};

export default function EndpointCard({
  endpoint,
  isSelected,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition ${
        isSelected
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {/* Method Badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {endpoint.methods.map((method) => (
          <span
            key={method}
            className={`px-2 py-1 rounded text-xs font-bold ${
              methodColors[method] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {method}
          </span>
        ))}
        {endpoint.hasAuth && (
          <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 font-semibold">
            🔒 Auth
          </span>
        )}
      </div>

      {/* Path */}
      <p className="font-mono text-sm text-gray-900 break-words">
        {endpoint.path}
      </p>

      {/* Domain */}
      {endpoint.domain && (
        <p className="text-xs text-gray-600 mt-1">
          Domain: <span className="font-semibold">{endpoint.domain}</span>
        </p>
      )}
    </button>
  );
}
