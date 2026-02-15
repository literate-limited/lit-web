export default function TimePerStepMetrics({ stats }) {
  // Mock time data - in real implementation, this would come from step_analytics
  const timeData = [
    { step: 'Step 1: Welcome', avgTime: 0.5, maxTime: 2 },
    { step: 'Step 2: Info', avgTime: 1.2, maxTime: 5 },
    { step: 'Step 3: Selection', avgTime: 2.8, maxTime: 8 },
    { step: 'Step 4: Confirmation', avgTime: 0.8, maxTime: 3 },
  ];

  const maxTime = Math.max(...timeData.map((d) => d.avgTime));

  return (
    <div className="space-y-4">
      {timeData.map((item, index) => (
        <div key={index} className="bg-slate-600 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">{item.step}</span>
            <span className="text-sm text-blue-400 font-bold">{item.avgTime.toFixed(1)}m</span>
          </div>
          <div className="bg-slate-700 rounded h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${(item.avgTime / maxTime) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Average: {item.avgTime}m | Max: {item.maxTime}m
          </p>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t border-slate-600">
        <p className="text-xs text-slate-400 mb-2">📊 Summary:</p>
        <div className="text-sm text-slate-300 space-y-1">
          <p>• Total avg time: {stats.avgTimeInMinutes} minutes</p>
          <p>• Longest step: Step 3 (2.8m) - Consider simplifying</p>
          <p>• Fastest step: Step 1 (0.5m) - Good introduction flow</p>
        </div>
      </div>
    </div>
  );
}
