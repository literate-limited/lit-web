import { useState, useEffect } from 'react';
import axios from 'axios';
import CompletionChart from './analytics/CompletionChart';
import DropoffAnalysis from './analytics/DropoffAnalysis';
import TimePerStepMetrics from './analytics/TimePerStepMetrics';
import VariantComparison from './analytics/VariantComparison';

const API_URL = import.meta.env.VITE_API_URL;

export default function WizardAnalyticsDashboard({ wizardKey }) {
  const [stats, setStats] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // days
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnalytics();
  }, [wizardKey, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, variantsRes] = await Promise.all([
        axios.get(`${API_URL}/wizards/${wizardKey}/analytics?days=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/wizards/${wizardKey}/variants-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(analyticsRes.data.stats);
      setVariants(variantsRes.data.variants || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Total Starts</p>
            <p className="text-4xl font-bold text-white">{stats.totalStarts || 0}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Completed</p>
            <p className="text-4xl font-bold text-white">{stats.totalCompleted || 0}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Completion Rate</p>
            <p className="text-4xl font-bold text-green-400">{stats.completionRate || 0}%</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Avg Time</p>
            <p className="text-4xl font-bold text-white">
              {stats.avgTimeInMinutes || 0}
              <span className="text-sm text-slate-400 ml-1">min</span>
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Chart */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Completion Rate</h3>
          {stats && <CompletionChart stats={stats} />}
        </div>

        {/* Dropoff Analysis */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Dropoff by Step</h3>
          {stats && <DropoffAnalysis stats={stats} />}
        </div>
      </div>

      {/* Time Per Step */}
      <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Time per Step</h3>
        {stats && <TimePerStepMetrics stats={stats} />}
      </div>

      {/* Variant Comparison */}
      {variants.length > 1 && (
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Variant Performance</h3>
          <VariantComparison variants={variants} />
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-200 mb-2">📊 Analytics Tips</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Completion rate shows what % of users finish the wizard</li>
          <li>• Dropoff analysis shows where users abandon</li>
          <li>• Time metrics help identify confusing steps</li>
          <li>• Variant comparison shows which version performs better</li>
          <li>• Use this data to improve wizard flow</li>
        </ul>
      </div>
    </div>
  );
}
