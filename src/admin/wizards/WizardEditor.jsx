import { useState, useEffect } from 'react';
import axios from 'axios';
import WizardStepBuilder from './WizardStepBuilder';
import WizardPreview from './WizardPreview';

const API_URL = import.meta.env.VITE_API_URL;

export default function WizardEditor({ wizard, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    type: 'setup',
    config: { steps: [] },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (wizard) {
      setFormData(wizard);
    } else {
      setFormData({
        key: '',
        name: '',
        description: '',
        type: 'setup',
        config: { steps: [] },
      });
    }
  }, [wizard]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStepsChange = (steps) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, steps },
    }));
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!formData.key.trim()) {
      setError('Wizard key is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Wizard name is required');
      return;
    }
    if (formData.config.steps.length === 0) {
      setError('At least one step is required');
      return;
    }

    setSaving(true);
    try {
      if (wizard) {
        // Update existing
        await axios.put(`${API_URL}/wizards/${wizard.key}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new
        await axios.post(`${API_URL}/wizards`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save wizard');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      // Save first
      if (formData.config.steps.length === 0) {
        setError('At least one step is required before publishing');
        setSaving(false);
        return;
      }

      if (!wizard) {
        // Create first, then publish
        const res = await axios.post(`${API_URL}/wizards`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await axios.post(`${API_URL}/wizards/${res.data.wizard.key}/publish`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Just publish existing
        await axios.post(`${API_URL}/wizards/${wizard.key}/publish`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish wizard');
    } finally {
      setSaving(false);
    }
  };

  if (previewMode) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(false)}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            ← Back to Editor
          </button>
        </div>
        <WizardPreview wizard={{ ...formData }} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form Inputs */}
        <div className="lg:col-span-1">
          <div className="bg-slate-700 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wizard Key
              </label>
              <input
                type="text"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                disabled={!!wizard}
                placeholder="e.g., onboarding-welcome"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Used in URLs and API calls. Cannot be changed once created.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wizard Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Display name"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What is this wizard for?"
                rows="3"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wizard Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="setup">Setup</option>
                <option value="process">Process</option>
                <option value="onboarding">Onboarding</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-600 space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                {saving ? 'Publishing...' : '🚀 Publish'}
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                👁️ Preview
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Right: Step Builder */}
        <div className="lg:col-span-2">
          <WizardStepBuilder
            steps={formData.config.steps}
            onStepsChange={handleStepsChange}
          />
        </div>
      </div>
    </div>
  );
}
