import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function TestResults({ results, onBack }) {
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const token = localStorage.getItem('token');

  const handlePromoteWinner = async () => {
    if (!results.winner) {
      alert('No statistically significant winner to promote');
      return;
    }

    if (!window.confirm(`Promote ${results.winner} to default wizard?`)) {
      return;
    }

    setPromoting(true);
    try {
      // This would call the API to set the winner
      // await axios.post(`${API_URL}/...`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPromoted(true);
    } catch (err) {
      alert('Failed to promote winner');
    } finally {
      setPromoting(false);
    }
  };

  const improvement = results.improvementPercent || 0;
  const isSignificant = results.isStatisticallySignificant;
  const winner = results.winner;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Test Results</h3>
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back
        </button>
      </div>

      {/* Test Info */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <h4 className="font-semibold text-white mb-3">{results.test.testName}</h4>
        {results.test.description && (
          <p className="text-slate-400 text-sm mb-3">{results.test.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Control Variant</p>
            <p className="font-semibold text-white">{results.test.controlVariant}</p>
          </div>
          <div>
            <p className="text-slate-400">Treatment Variant</p>
            <p className="font-semibold text-white">{results.test.treatmentVariant}</p>
          </div>
          <div>
            <p className="text-slate-400">Confidence Level</p>
            <p className="font-semibold text-white">{results.test.confidenceLevel}%</p>
          </div>
          <div>
            <p className="text-slate-400">Sample Size Required</p>
            <p className="font-semibold text-white">{results.test.sampleSizeRequired}</p>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Results */}
        <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
          <h5 className="font-semibold text-white mb-4">Control: {results.control.variant}</h5>
          <div className="space-y-3">
            <div>
              <p className="text-blue-200 text-sm">Starts</p>
              <p className="text-2xl font-bold text-white">{results.control.totalStarts}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{results.control.totalCompleted}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-400">
                {results.control.completionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Avg Time</p>
              <p className="text-xl font-bold text-white">
                {results.control.avgTimeMinutes.toFixed(1)}m
              </p>
            </div>
          </div>
        </div>

        {/* Treatment Results */}
        <div className="bg-green-900 rounded-lg p-4 border border-green-700">
          <h5 className="font-semibold text-white mb-4">Treatment: {results.treatment.variant}</h5>
          <div className="space-y-3">
            <div>
              <p className="text-green-200 text-sm">Starts</p>
              <p className="text-2xl font-bold text-white">{results.treatment.totalStarts}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{results.treatment.totalCompleted}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-green-400">
                {results.treatment.completionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Avg Time</p>
              <p className="text-xl font-bold text-white">
                {results.treatment.avgTimeMinutes.toFixed(1)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistical Analysis */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 space-y-4">
        <h5 className="font-semibold text-white">Statistical Analysis</h5>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Improvement</p>
            <p className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">P-Value</p>
            <p className="text-2xl font-bold text-white">{results.pValue.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Significance</p>
            <p
              className={`text-lg font-bold ${
                isSignificant ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {isSignificant ? '✓ Significant' : '✗ Not Sig'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-600">
          <p className="text-sm text-slate-300 mb-2">
            {isSignificant
              ? `✅ The results are statistically significant at ${results.test.confidenceLevel}% confidence level. The treatment variant shows a ${improvement.toFixed(1)}% improvement in completion rate.`
              : `⚠️ The difference is not statistically significant yet. Continue testing to gather more data.`}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {winner && isSignificant && (
        <div className="bg-green-900 rounded-lg p-4 border border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white mb-1">🏆 Winner Found!</p>
              <p className="text-green-200 text-sm">
                {winner} has significantly better completion rates
              </p>
            </div>
            <button
              onClick={handlePromoteWinner}
              disabled={promoting || promoted}
              className={`font-semibold py-2 px-6 rounded transition-colors ${
                promoted
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {promoted ? '✓ Promoted' : promoting ? 'Promoting...' : '🚀 Promote Winner'}
            </button>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-200 mb-2">💡 Recommendations:</h5>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>
            • {isSignificant ? 'Promote the winner to make it your default wizard' : 'Continue running the test to reach statistical significance'}
          </li>
          <li>• Use these insights to improve future wizard versions</li>
          <li>• Monitor post-promotion performance to ensure sustained improvement</li>
          <li>• Consider testing other variations based on learnings</li>
        </ul>
      </div>
    </div>
  );
}
