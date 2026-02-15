export default function DropoffAnalysis({ stats }) {
  // Mock dropoff data - in real implementation, this would come from step_analytics
  const dropoffData = [
    { step: 'Step 1: Welcome', dropoff: 5, percentage: 5 },
    { step: 'Step 2: Info', dropoff: 12, percentage: 12 },
    { step: 'Step 3: Selection', dropoff: 25, percentage: 25 },
    { step: 'Step 4: Confirmation', dropoff: 8, percentage: 8 },
  ];

  const maxDropoff = Math.max(...dropoffData.map((d) => d.percentage));

  return (
    <div className="space-y-4">
      {dropoffData.map((item, index) => (
        <div key={index}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300">{item.step}</span>
            <span className="text-sm font-semibold text-white">{item.dropoff} users</span>
          </div>
          <div className="bg-slate-600 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all"
              style={{ width: `${(item.percentage / maxDropoff) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{item.percentage}% dropoff</p>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t border-slate-600">
        <p className="text-xs text-slate-400 mb-2">💡 Recommendation:</p>
        <p className="text-sm text-slate-300">
          Step 3 has the highest dropoff rate. Consider simplifying or clarifying this step.
        </p>
      </div>
    </div>
  );
}
