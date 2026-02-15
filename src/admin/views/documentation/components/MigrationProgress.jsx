/**
 * Migration Progress
 *
 * Displays migration progress from MongoDB to PostgreSQL
 */

export default function MigrationProgress({ status }) {
  if (!status) return null;

  const { migrated, total, percentage } = status;

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Migration Progress</h3>
        <span className="text-sm font-semibold text-gray-600">
          {migrated}/{total} ({percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {percentage === 100
          ? '✅ All planned models migrated to PostgreSQL'
          : `${total - migrated} models remaining`}
      </p>
    </div>
  );
}
