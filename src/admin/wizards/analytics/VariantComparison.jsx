export default function VariantComparison({ variants }) {
  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No variant data available</p>
      </div>
    );
  }

  const maxCompletions = Math.max(...variants.map((v) => v.totalCompleted));

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-3 px-4 text-white font-semibold">Variant</th>
              <th className="text-center py-3 px-4 text-white font-semibold">Starts</th>
              <th className="text-center py-3 px-4 text-white font-semibold">Completed</th>
              <th className="text-center py-3 px-4 text-white font-semibold">Rate</th>
              <th className="text-center py-3 px-4 text-white font-semibold">Traffic</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => (
              <tr key={index} className="border-b border-slate-700 hover:bg-slate-600/50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-white">{variant.name}</p>
                    <p className="text-xs text-slate-400">{variant.variant}</p>
                  </div>
                </td>
                <td className="text-center py-3 px-4 text-white">{variant.totalStarts}</td>
                <td className="text-center py-3 px-4">
                  <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-sm font-semibold">
                    {variant.totalCompleted}
                  </span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-blue-400 font-bold">{variant.completionRate}%</span>
                </td>
                <td className="text-center py-3 px-4 text-white">
                  {variant.trafficAllocation}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Completion Rate Bars */}
      <div>
        <p className="text-sm font-semibold text-white mb-4">Completion Rate Comparison</p>
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{variant.name}</span>
                <span className="text-sm font-semibold text-white">
                  {variant.completionRate}%
                  {variant.isWinner && <span className="text-green-400 ml-2">🏆 Winner</span>}
                </span>
              </div>
              <div className="bg-slate-600 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${variant.isWinner ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${variant.completionRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-200 mb-2">🧪 A/B Test Recommendations:</p>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>
            • {variants[0]?.name} variant has {variants[0]?.completionRate}% completion rate
          </li>
          {variants.length > 1 && (
            <li>
              • Improvement: {(variants[0]?.completionRate - variants[1]?.completionRate).toFixed(1)}%
              compared to {variants[1]?.name}
            </li>
          )}
          <li>• Ensure sufficient sample size before declaring a winner</li>
          <li>• Use statistical significance tests (Chi-square) for confidence</li>
        </ul>
      </div>
    </div>
  );
}
