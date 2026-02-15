/**
 * Endpoint Detail Panel
 *
 * Shows comprehensive endpoint information
 */

const methodColors = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-purple-100 text-purple-800',
  DELETE: 'bg-red-100 text-red-800'
};

export default function EndpointDetailPanel({ endpoint }) {
  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Select an endpoint to view details</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Path */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 break-words">
        {endpoint.path}
      </h2>

      {/* Methods */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {endpoint.methods.map((method) => (
          <span
            key={method}
            className={`px-3 py-1 rounded-lg text-sm font-bold ${
              methodColors[method] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {method}
          </span>
        ))}
      </div>

      {/* Domain */}
      {endpoint.domain && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Domain</p>
          <p className="font-semibold text-gray-900">{endpoint.domain}</p>
        </div>
      )}

      {/* Authentication */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Authentication</p>
        <p className="text-gray-900">
          {endpoint.hasAuth ? (
            <span>
              🔒 <strong>Required</strong> - Bearer token authentication
            </span>
          ) : (
            <span>
              🔓 <strong>Not Required</strong> - Public endpoint
            </span>
          )}
        </p>
      </div>

      {/* Middleware Chain */}
      {endpoint.middlewares && endpoint.middlewares.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Middleware Chain</h3>
          <div className="space-y-2">
            {endpoint.middlewares.map((mw, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 rounded px-3 py-2">
                  <p className="text-sm font-mono text-gray-900">{mw}</p>
                </div>
                {idx < endpoint.middlewares.length - 1 && (
                  <p className="text-gray-400">↓</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handler */}
      {endpoint.handler && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Handler</p>
          <p className="font-mono text-sm text-gray-900">{endpoint.handler}</p>
        </div>
      )}

      {/* Note */}
      <div className="mt-8 pt-6 border-t text-xs text-gray-600">
        <p>
          💡 <strong>Tip:</strong> This documentation is auto-generated from your
          API routes. It will update automatically as routes change.
        </p>
      </div>
    </div>
  );
}
