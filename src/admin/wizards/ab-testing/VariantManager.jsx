import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function VariantManager({ wizardKey, variants, onVariantCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    variantKey: '',
    variantName: '',
    trafficAllocation: 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'trafficAllocation' ? parseInt(value) : value,
    }));
  };

  const handleCreateVariant = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.variantKey.trim() || !formData.variantName.trim()) {
      setError('Variant key and name are required');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/wizards/${wizardKey}/variants`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData({ variantKey: '', variantName: '', trafficAllocation: 50 });
      setShowForm(false);
      onVariantCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  };

  const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Wizard Variants</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Create Variant
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreateVariant}
          className="mb-6 bg-slate-700 rounded-lg p-4 border border-slate-600 space-y-4"
        >
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Variant Key
            </label>
            <input
              type="text"
              name="variantKey"
              value={formData.variantKey}
              onChange={handleInputChange}
              placeholder="e.g., variant-b, treatment"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Variant Name
            </label>
            <input
              type="text"
              name="variantName"
              value={formData.variantName}
              onChange={handleInputChange}
              placeholder="e.g., Simplified Flow"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Traffic Allocation (%)
            </label>
            <input
              type="number"
              name="trafficAllocation"
              value={formData.trafficAllocation}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              This variant will receive {formData.trafficAllocation}% of traffic
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded transition-colors"
            >
              {saving ? 'Creating...' : 'Create Variant'}
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

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No variants yet. Create your first variant to start testing!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Traffic allocation warning */}
          {totalAllocation > 100 && (
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-sm">
              ⚠️ Total traffic allocation is {totalAllocation}%. It should equal 100%.
            </div>
          )}

          {variants.map((variant) => (
            <div key={variant._id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">{variant.variantName}</h4>
                  <p className="text-sm text-slate-400 font-mono">{variant.variantKey}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Traffic Allocation</p>
                      <p className="text-lg font-bold text-blue-400">
                        {variant.trafficAllocation}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          variant.isWinner
                            ? 'bg-green-900 text-green-200 border border-green-700'
                            : 'bg-blue-900 text-blue-200 border border-blue-700'
                        }`}
                      >
                        {variant.isWinner ? '🏆 Winner' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Traffic bar */}
                  <div className="mt-3">
                    <div className="bg-slate-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{ width: `${variant.trafficAllocation}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="text-slate-500 text-sm opacity-50 cursor-not-allowed"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-900 border border-blue-700 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-200 mb-2">ℹ️ Variant Tips:</p>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Traffic allocation determines what % of users see each variant</li>
          <li>• Start with 50/50 for fair comparison</li>
          <li>• Must total 100% to run a valid test</li>
          <li>• Each variant can have different steps and configurations</li>
          <li>• Once a winner is selected, they become the default wizard</li>
        </ul>
      </div>
    </div>
  );
}
