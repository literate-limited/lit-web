/**
 * Database Layout
 *
 * Provides SQL-only view (MongoDB removed)
 */

export default function DatabaseLayout({ children }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex">
        <div className="flex-1 bg-white rounded-lg border overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-b p-3">
              <h3 className="font-bold text-green-900">PostgreSQL</h3>
              <p className="text-xs text-green-700">Relational data</p>
            </div>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
