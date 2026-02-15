import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function TestRunner({
  wizardKey,
  variants,
  tests,
  onTestCreated,
  onTestSelected,
  onResultsAvailable,
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    description: '',
    controlVariant: variants[0]?.variantKey || '',
    treatmentVariant: variants[1]?.variantKey || '',
    sampleSizeRequired: 100,
    confidenceLevel: 95,
  });
  const [saving, setSaving] = useState(false);
  const [loadingResults, setLoadingResults] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'sampleSizeRequired' || name === 'confidenceLevel'
          ? parseInt(value)
          : value,
    }));
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.testName.trim()) {
      setError('Test name is required');
      return;
    }

    if (formData.controlVariant === formData.treatmentVariant) {
      setError('Control and treatment variants must be different');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/wizards/${wizardKey}/ab-tests`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData({
        testName: '',
        description: '',
        controlVariant: variants[0]?.variantKey || '',
        treatmentVariant: variants[1]?.variantKey || '',
        sampleSizeRequired: 100,
        confidenceLevel: 95,
      });
      setShowForm(false);
      onTestCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
    } finally {
      setSaving(false);
    }
  };

  const handleViewResults = async (testId) => {
    setLoadingResults(testId);
    try {
      const res = await axios.get(`${API_URL}/wizards/ab-tests/${testId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onResultsAvailable(res.data);
      onTestSelected({ _id: testId });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoadingResults(null);
    }
  };

  const runningTests = tests.filter((t) => t.status === 'running');
  const completedTests = tests.filter((t) => t.status === 'completed');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">A/B Tests</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={variants.length < 2}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Create Test
        </button>
      </div>

      {variants.length < 2 && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-4 text-sm">
          ⚠️ You need at least 2 variants to create a test.
        </div>
      )}

      {/* Create Test Form */}
      {showForm && (
        <form
          onSubmit={handleCreateTest}
          className="mb-6 bg-slate-700 rounded-lg p-4 border border-slate-600 space-y-4"
        >
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Test Name
            </label>
            <input
              type="text"
              name="testName"
              value={formData.testName}
              onChange={handleInputChange}
              placeholder="e.g., Simplified Flow Test"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              placeholder="What are you testing?"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Control Variant
              </label>
              <select
                name="controlVariant"
                value={formData.controlVariant}
                onChange={handleInputChange}
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {variants.map((v) => (
                  <option key={v._id} value={v.variantKey}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Treatment Variant
              </label>
              <select
                name="treatmentVariant"
                value={formData.treatmentVariant}
                onChange={handleInputChange}
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {variants.map((v) => (
                  <option key={v._id} value={v.variantKey}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Sample Size Required
              </label>
              <input
                type="number"
                name="sampleSizeRequired"
                value={formData.sampleSizeRequired}
                onChange={handleInputChange}
                min="10"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Minimum completions needed per variant
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Confidence Level
              </label>
              <select
                name="confidenceLevel"
                value={formData.confidenceLevel}
                onChange={handleInputChange}
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value={90}>90% (p &lt; 0.10)</option>
                <option value={95}>95% (p &lt; 0.05)</option>
                <option value={99}>99% (p &lt; 0.01)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded transition-colors"
            >
              {saving ? 'Creating...' : 'Create Test'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Running Tests */}
      {runningTests.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3">🚀 Running Tests</h4>
          <div className="space-y-2">
            {runningTests.map((test) => (
              <div
                key={test._id}
                className="bg-slate-700 rounded-lg p-4 border border-green-600/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{test.testName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Control: {test.controlVariant} vs Treatment: {test.treatmentVariant}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewResults(test._id)}
                    disabled={loadingResults === test._id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
                  >
                    {loadingResults === test._id ? 'Loading...' : 'View Results'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">✅ Completed Tests</h4>
          <div className="space-y-2">
            {completedTests.map((test) => (
              <div
                key={test._id}
                className="bg-slate-700 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{test.testName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Winner: {test.winnerVariant}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewResults(test._id)}
                    disabled={loadingResults === test._id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
                  >
                    {loadingResults === test._id ? 'Loading...' : 'View Results'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tests.length === 0 && !showForm && (
        <div className="text-center py-8 text-slate-400">
          <p>No tests yet. Create your first A/B test!</p>
        </div>
      )}
    </div>
  );
}
