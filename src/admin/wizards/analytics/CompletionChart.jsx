export default function CompletionChart({ stats }) {
  const completionRate = parseFloat(stats.completionRate) || 0;
  const incompletionRate = 100 - completionRate;

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-40 h-40">
        {/* SVG Pie Chart */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Completion slice */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#10b981"
            strokeWidth="20"
            strokeDasharray={`${(completionRate / 100) * 282.7} 282.7`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
          />
          {/* Incompletion slice */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#6b7280"
            strokeWidth="20"
            strokeDasharray={`${(incompletionRate / 100) * 282.7} 282.7`}
            strokeLinecap="round"
            style={{
              transform: `rotate(${(completionRate / 100) * 360 - 90}deg)`,
              transformOrigin: '50px 50px',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-white">{completionRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400">completed</p>
        </div>
      </div>

      {/* Legend */}
      <div className="ml-8 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <div>
            <p className="text-white font-semibold">{stats.totalCompleted}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
          <div>
            <p className="text-white font-semibold">
              {stats.totalStarts - stats.totalCompleted}
            </p>
            <p className="text-xs text-slate-400">Abandoned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
